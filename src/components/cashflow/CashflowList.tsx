import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CashflowForm } from './CashflowForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Cashflow = Tables<'cashflows'>;
type CashflowType = 'deposit' | 'withdrawal';

interface CashflowListProps {
  cashflows: Cashflow[];
  type?: 'deposit' | 'withdrawal';
  sortBy?: string;
  loading?: boolean;
  currency: 'USD' | 'PHP';
  isTrader: boolean;
  onUpdate: () => void;
}

export function CashflowList({ 
  cashflows, 
  type, 
  sortBy = 'date_desc', 
  loading, 
  currency,
  isTrader,
  onUpdate 
}: CashflowListProps) {
  const { toast } = useToast();
  const [editingCashflow, setEditingCashflow] = useState<Cashflow | null>(null);
  const [deletingCashflow, setDeletingCashflow] = useState<Cashflow | null>(null);

  // Filter cashflows by type if specified
  const filteredCashflows = type 
    ? cashflows.filter(cf => cf.type === type)
    : cashflows;

  // Sort cashflows
  const sortedCashflows = [...filteredCashflows].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
      case 'date_desc':
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      case 'amount_asc':
        return a.amount - b.amount;
      case 'amount_desc':
        return b.amount - a.amount;
      case 'type':
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      default:
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
    }
  });

  const handleDelete = async (cashflow: Cashflow) => {
    try {
      const { error } = await supabase
        .from('cashflows')
        .delete()
        .eq('id', cashflow.id);

      if (error) throw error;

      setDeletingCashflow(null);
      
      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTypeBadge = (type: string) => {
    return type === 'deposit' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <ArrowDownCircle className="w-3 h-3 mr-1" />
        Deposit
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <ArrowUpCircle className="w-3 h-3 mr-1" />
        Withdrawal
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="crypto-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted/50 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sortedCashflows.length === 0) {
    return (
      <Card className="crypto-card">
        <CardContent className="p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No transactions found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isTrader 
              ? type 
                ? `No ${type}s recorded yet`
                : "Start by recording your first deposit or withdrawal"
              : "Your trader hasn't made any cash transactions yet"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="crypto-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source/Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                {isTrader && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCashflows.map((cashflow) => (
                <TableRow key={cashflow.id}>
                  <TableCell>{getTypeBadge(cashflow.type)}</TableCell>
                  <TableCell className="font-medium">
                    <span className={`${
                      cashflow.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {cashflow.type === 'deposit' ? '+' : '-'}{formatCurrency(cashflow.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {cashflow.source || cashflow.destination || '-'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(cashflow.transaction_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate">
                      {cashflow.notes || '-'}
                    </div>
                  </TableCell>
                  {isTrader && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingCashflow(cashflow)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingCashflow(cashflow)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCashflow} onOpenChange={() => setEditingCashflow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCashflow?.id ? 'Edit Transaction' : 'Add New Transaction'}
            </DialogTitle>
          </DialogHeader>
          {editingCashflow && (
            <CashflowForm 
              type={(editingCashflow.type || 'deposit') as CashflowType}
              cashflow={editingCashflow.id ? editingCashflow : undefined}
              onSuccess={() => {
                setEditingCashflow(null);
                onUpdate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCashflow} onOpenChange={() => setDeletingCashflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingCashflow && handleDelete(deletingCashflow)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}