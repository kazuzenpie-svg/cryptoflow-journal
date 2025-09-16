import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowDownCircle, ArrowUpCircle, Filter, Download, ArrowUpDown, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { CashflowForm } from '@/components/cashflow/CashflowForm';
import { CashflowList } from '@/components/cashflow/CashflowList';
import { supabase } from '@/integrations/supabase/client';
import { Cashflow } from '@/types/database';

export default function CashflowPage() {
  const { profile, isTrader } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [cashflows, setCashflows] = useState<Cashflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashflowCount, setCashflowCount] = useState<number>(0);
  const [formType, setFormType] = useState<'deposit' | 'withdrawal'>('deposit');

  // Fetch cashflows
  useEffect(() => {
    const fetchCashflows = async () => {
      if (!profile) return;

      try {
        setLoading(true);
        let query = supabase
          .from('cashflows')
          .select('*')
          .order('transaction_date', { ascending: false });

        // For traders, get their own cashflows
        if (isTrader) {
          query = query.eq('user_id', profile.id);
        } else {
          // For investors, get their bound trader's cashflows
          if (profile.bound_trader_id) {
            // Verify the binding is still approved
            const { data: binding } = await supabase
              .from('bindings')
              .select('status')
              .eq('investor_id', profile.id)
              .eq('trader_id', profile.bound_trader_id)
              .eq('status', 'approved')
              .maybeSingle();
              
            if (binding) {
              query = query.eq('user_id', profile.bound_trader_id);
            } else {
              setCashflows([]);
              setLoading(false);
              return;
            }
          } else {
            setCashflows([]);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await query;

        if (error) throw error;
        
        setCashflows(data as Cashflow[] || []);
        setCashflowCount(data?.length || 0);
        console.log(`✅ Loaded ${data?.length || 0} cashflow entries`);
      } catch (error) {
        console.error('❌ Error fetching cashflows:', error);
        setCashflows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCashflows();
  }, [profile, isTrader]);

  // Calculate totals
  const totals = React.useMemo(() => {
    const deposits = cashflows.filter(cf => cf.type === 'deposit');
    const withdrawals = cashflows.filter(cf => cf.type === 'withdrawal');
    
    const totalDeposits = deposits.reduce((sum, cf) => sum + cf.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, cf) => sum + cf.amount, 0);
    const netCashflow = totalDeposits - totalWithdrawals;
    
    return {
      totalDeposits,
      totalWithdrawals,
      netCashflow,
      depositCount: deposits.length,
      withdrawalCount: withdrawals.length
    };
  }, [cashflows]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: profile?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    // Refresh the cashflow data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            {isTrader ? 'Cash Flow Management' : 'Trader Cash Flow'}
          </h1>
          <p className="text-muted-foreground">
            {isTrader 
              ? 'Track your deposits and withdrawals' 
              : 'View your trader\'s cash flow activity'
            }
          </p>
        </div>
        
        {isTrader && (
          <div className="flex gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setFormType('deposit')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="crypto-card-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalDeposits)}</p>
                <p className="text-xs text-muted-foreground">{totals.depositCount} transactions</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <ArrowDownCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="crypto-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalWithdrawals)}</p>
                <p className="text-xs text-muted-foreground">{totals.withdrawalCount} transactions</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <ArrowUpCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totals.netCashflow >= 0 ? "crypto-card-blue" : "crypto-card"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${totals.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.netCashflow)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totals.netCashflow >= 0 ? 'Positive flow' : 'Negative flow'}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${totals.netCashflow >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                {totals.netCashflow >= 0 ? (
                  <TrendingUp className={`w-6 h-6 ${totals.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="crypto-card-coral">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Cash</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.netCashflow)}</p>
                <p className="text-xs text-muted-foreground">For new investments</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Buttons for Traders */}
      {isTrader && (
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={() => setFormType('deposit')}
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Record Deposit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Deposit</DialogTitle>
              </DialogHeader>
              <CashflowForm 
                type="deposit" 
                onSuccess={handleFormSuccess} 
              />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setFormType('withdrawal')}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Record Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Withdrawal</DialogTitle>
              </DialogHeader>
              <CashflowForm 
                type="withdrawal" 
                onSuccess={handleFormSuccess} 
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Cashflow Table */}
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {isTrader ? 'Your deposit and withdrawal history' : `${profile?.bound_trader_id ? 'Trader' : 'No'} transaction history`}
            {cashflowCount > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({cashflowCount} total transaction{cashflowCount !== 1 ? 's' : ''})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All ({cashflowCount})
              </TabsTrigger>
              <TabsTrigger value="deposit" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Deposits ({totals.depositCount})
              </TabsTrigger>
              <TabsTrigger value="withdrawal" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                Withdrawals ({totals.withdrawalCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedType} className="mt-6">
              <CashflowList 
                cashflows={cashflows}
                type={selectedType === 'all' ? undefined : selectedType as 'deposit' | 'withdrawal'}
                sortBy={sortBy}
                loading={loading}
                currency={profile?.currency || 'USD'}
                isTrader={isTrader}
                onUpdate={handleFormSuccess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}