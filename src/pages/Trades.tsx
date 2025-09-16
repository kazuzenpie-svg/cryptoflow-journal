import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TradesList } from '@/components/trades/TradesList';
import { TradeForm } from '@/components/trades/TradeForm';
import { SpotPnLDashboard } from '@/components/trades/SpotPnLDashboard';
import { PriceTestPanel } from '@/components/trades/PriceTestPanel';
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
import { Plus, Filter, Download, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/types/database';

export default function Trades() {
  const { profile, isTrader } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);

  // Fetch all trades for PnL calculation
  useEffect(() => {
    const fetchAllTrades = async () => {
      if (!profile) return;

      try {
        let query = supabase
          .from('trades')
          .select('*');

        // For traders, get their own trades
        if (isTrader) {
          query = query.eq('user_id', profile.id);
        } else {
          // For investors, get their bound trader's trades
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
              setAllTrades([]);
              return;
            }
          } else {
            setAllTrades([]);
            return;
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        
        setAllTrades(data as Trade[] || []);
      } catch (error) {
        console.error('Error fetching trades for PnL:', error);
        setAllTrades([]);
      }
    };

    fetchAllTrades();
  }, [profile, isTrader]);

  return (
    <div className="space-y-6">
      {/* Spot PnL Dashboard */}
      {(selectedCategory === 'all' || selectedCategory === 'spot') && (
        <SpotPnLDashboard 
          trades={allTrades} 
          currency={profile?.currency || 'USD'} 
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            {isTrader ? 'Trade Journal' : 'Trader Activity'}
          </h1>
          <p className="text-muted-foreground">
            {isTrader 
              ? 'Manage your crypto trades and investments' 
              : 'View your trader\'s portfolio activity'
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
                <SelectItem value="asset_asc">Asset (A-Z)</SelectItem>
                <SelectItem value="asset_desc">Asset (Z-A)</SelectItem>
                <SelectItem value="pnl_desc">P&L (High to Low)</SelectItem>
                <SelectItem value="pnl_asc">P&L (Low to High)</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Trade</DialogTitle>
                </DialogHeader>
                <TradeForm onSuccess={() => {
                  setIsFormOpen(false);
                  // Refresh trades data for PnL calculation
                  window.location.reload();
                }} />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Temporarily add test panel for development */}
        {process.env.NODE_ENV === 'development' && (
          <PriceTestPanel />
        )}
      </div>

      {/* Category Tabs */}
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>
            Filter by category to view specific trade types
            {tradeCount > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({tradeCount} {selectedCategory === 'all' ? 'total' : selectedCategory} trade{tradeCount !== 1 ? 's' : ''})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(value) => {
            setSelectedCategory(value);
            console.log(`✅ Category filter changed to: ${value}`);
          }}>
            <TabsList className="grid w-full grid-cols-7 h-12">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
              <TabsTrigger value="spot" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Spot</TabsTrigger>
              <TabsTrigger value="futures" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Futures</TabsTrigger>
              <TabsTrigger value="defi" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">DeFi</TabsTrigger>
              <TabsTrigger value="dual_investment" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Dual</TabsTrigger>
              <TabsTrigger value="liquidity_pool" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">LP</TabsTrigger>
              <TabsTrigger value="liquidity_mining" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Mining</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedCategory} className="mt-6">
              <TradesList 
                category={selectedCategory === 'all' ? undefined : selectedCategory}
                sortBy={sortBy}
                onTradeCountChange={setTradeCount}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}