import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type CashflowType = 'deposit' | 'withdrawal';
type Cashflow = Tables<'cashflows'>;

const cashflowSchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number().positive('Amount must be positive'),
  source: z.string().optional(),
  destination: z.string().optional(),
  transaction_date: z.date(),
  notes: z.string().optional(),
});

interface CashflowFormProps {
  type: CashflowType;
  onSuccess: () => void;
  cashflow?: Cashflow;
}

export function CashflowForm({ type, onSuccess, cashflow }: CashflowFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(cashflowSchema),
    defaultValues: {
      type: cashflow?.type || type,
      amount: cashflow?.amount || 0,
      source: cashflow?.source || '',
      destination: cashflow?.destination || '',
      transaction_date: cashflow?.transaction_date ? new Date(cashflow.transaction_date) : new Date(),
      notes: cashflow?.notes || '',
    },
  });

  const watchedType = form.watch('type');

  const onSubmit = async (data: any) => {
    if (!profile) return;

    setLoading(true);
    try {
      const cashflowData = {
        user_id: profile.id,
        type: data.type,
        amount: data.amount,
        currency: profile.currency,
        source: data.type === 'deposit' ? data.source : null,
        destination: data.type === 'withdrawal' ? data.destination : null,
        transaction_date: data.transaction_date.toISOString(),
        notes: data.notes || null,
      };

      let result;
      if (cashflow?.id) {
        result = await supabase
          .from('cashflows')
          .update(cashflowData)
          .eq('id', cashflow.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cashflows')
          .insert(cashflowData)
          .select()
          .single();
      }

      const { error } = result;
      if (error) throw error;

      toast({
        title: cashflow?.id ? "Transaction Updated" : "Transaction Recorded",
        description: `${data.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${profile.currency === 'USD' ? '$' : '₱'}${data.amount.toLocaleString()} has been ${cashflow?.id ? 'updated' : 'recorded'}.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sources = ['Bank Transfer', 'Credit Card', 'Crypto Wallet', 'Wire Transfer', 'Cash', 'Other'];
  const destinations = ['Bank Account', 'Crypto Wallet', 'Investment Account', 'Savings Account', 'Cash', 'Other'];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="deposit">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-green-600" />
                      Deposit
                    </div>
                  </SelectItem>
                  <SelectItem value="withdrawal">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-red-600" />
                      Withdrawal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({profile?.currency || 'USD'})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedType === 'deposit' ? (
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deposit source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select withdrawal destination" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {destinations.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="transaction_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full",
            watchedType === 'deposit' 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-red-600 hover:bg-red-700"
          )}
        >
          {loading ? "Processing..." : `Record ${watchedType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
        </Button>
      </form>
    </Form>
  );
}