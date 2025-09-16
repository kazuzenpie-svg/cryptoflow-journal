import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trade } from '@/types/database';
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
import { TradeForm } from './TradeForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { RealTimePriceCell } from './RealTimePriceCell';

interface TradesListProps {
  category?: string;
  sortBy?: string;
  onTradeCountChange?: (count: number) => void;
}

export function TradesList({ category, sortBy = 'date_desc', onTradeCountChange }: TradesListProps) {
  const { profile, isTrader } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    fetchTrades();
  }, [profile, category, sortBy]);

  const fetchTrades = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      let query = supabase
        .from('trades')
        .select('*')
        .order('trade_date', { ascending: false }); // Most recent first

      // For traders, get their own trades
      if (isTrader) {
        query = query.eq('user_id', profile.id);
      } else {
        // For investors, get their bound trader's trades
        // Check if investor has an approved binding
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
            setTrades([]);
            setLoading(false);
            return;
          }
        } else {
          setTrades([]);
          setLoading(false);
          return;
        }
      }

      // Apply category filter if specified
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Additional client-side sorting based on sortBy parameter
      const sortedTrades = (data as Trade[]).sort((a, b) => {
        switch (sortBy) {
          case 'date_asc':
            return new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime();
          case 'date_desc':
            return new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime();
          case 'asset_asc':
            return a.asset.localeCompare(b.asset);
          case 'asset_desc':
            return b.asset.localeCompare(a.asset);
          case 'pnl_desc':
            const aPnL = a.profit_loss || 0;
            const bPnL = b.profit_loss || 0;
            return bPnL - aPnL;
          case 'pnl_asc':
            const aPnLAsc = a.profit_loss || 0;
            const bPnLAsc = b.profit_loss || 0;
            return aPnLAsc - bPnLAsc;
          case 'category':
            const categoryOrder = ['spot', 'futures', 'defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining'];
            const aIndex = categoryOrder.indexOf(a.category);
            const bIndex = categoryOrder.indexOf(b.category);
            if (aIndex !== bIndex) return aIndex - bIndex;
            // Secondary sort by date (newest first) for same category
            return new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime();
          default:
            // Default sort: date desc, then category, then asset
            const dateComparison = new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime();
            if (dateComparison !== 0) return dateComparison;
            
            const categoryOrderDefault = ['spot', 'futures', 'defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining'];
            const aIndexDefault = categoryOrderDefault.indexOf(a.category);
            const bIndexDefault = categoryOrderDefault.indexOf(b.category);
            if (aIndexDefault !== bIndexDefault) return aIndexDefault - bIndexDefault;
            
            return a.asset.localeCompare(b.asset);
        }
      });
      
      setTrades(sortedTrades);
      onTradeCountChange?.(sortedTrades.length);
      console.log(`✅ Loaded ${sortedTrades.length} trades${category && category !== 'all' ? ` for category: ${category}` : ''}`);
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trade: Trade) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', trade.id);

      if (error) throw error;

      setTrades(prev => prev.filter(t => t.id !== trade.id));
      setDeletingTrade(null);
      
      toast({
        title: "Trade deleted",
        description: "The trade has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { variant: string; label: string; color?: string }> = {
      spot: { variant: 'default', label: 'Spot', color: 'bg-blue-500' },
      futures: { variant: 'secondary', label: 'Futures', color: 'bg-orange-500' },
      defi: { variant: 'outline', label: 'DeFi', color: 'bg-green-500' },
      dual_investment: { variant: 'destructive', label: 'Dual Investment', color: 'bg-purple-500' },
      liquidity_pool: { variant: 'default', label: 'Liquidity Pool', color: 'bg-cyan-500' },
      liquidity_mining: { variant: 'secondary', label: 'Liquidity Mining', color: 'bg-yellow-500' },
    };

    const config = categoryConfig[category] || { variant: 'outline', label: category.replace('_', ' '), color: 'bg-gray-500' };

    return (
      <Badge variant={config.variant as any} className="whitespace-nowrap">
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
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

  if (trades.length === 0) {
    return (
      <Card className="crypto-card">
        <CardContent className="p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No trades found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isTrader 
              ? "Start by adding your first trade or investment"
              : "Your trader hasn't made any trades yet"
            }
          </p>
          {isTrader && (
            <Button onClick={() => setEditingTrade({} as Trade)}>
              Add Your First Trade
            </Button>
          )}
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
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>P&L</TableHead>
                {isTrader && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.asset}</TableCell>
                  <TableCell>{getCategoryBadge(trade.category)}</TableCell>
                  <TableCell>
                    {formatCurrency(trade.price, trade.currency)}
                  </TableCell>
                  <TableCell>
                    <RealTimePriceCell 
                      asset={trade.asset}
                      currency={trade.currency as 'USD' | 'PHP'}
                      purchasePrice={trade.price}
                      quantity={trade.quantity}
                      category={trade.category}
                    />
                  </TableCell>
                  <TableCell>{trade.quantity.toLocaleString()}</TableCell>
                  <TableCell>
                    {format(new Date(trade.trade_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {trade.profit_loss ? (
                      <div className={`flex items-center gap-1 ${
                        trade.profit_loss >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {trade.profit_loss >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {formatCurrency(Math.abs(trade.profit_loss), trade.currency)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {isTrader && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTrade(trade)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingTrade(trade)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
      <Dialog open={!!editingTrade} onOpenChange={() => setEditingTrade(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTrade?.id ? 'Edit Trade' : 'Add New Trade'}
            </DialogTitle>
          </DialogHeader>
          {editingTrade && (
            <TradeForm 
              trade={editingTrade.id ? editingTrade : undefined}
              onSuccess={() => {
                setEditingTrade(null);
                fetchTrades();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTrade} onOpenChange={() => setDeletingTrade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingTrade && handleDelete(deletingTrade)}
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