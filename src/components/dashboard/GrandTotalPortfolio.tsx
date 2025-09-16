import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, DollarSign, Activity } from 'lucide-react';
import { usePortfolioPnL, usePriceCache } from '@/hooks/usePriceData';
import { Trade, Cashflow } from '@/types/database';
import { cn } from '@/lib/utils';

interface GrandTotalPortfolioProps {
  trades: Trade[];
  cashflows: Cashflow[];
  currency: 'USD' | 'PHP';
  className?: string;
}

export function GrandTotalPortfolio({ trades, cashflows, currency, className }: GrandTotalPortfolioProps) {
  const { portfolioData, loading, error, lastUpdated, refetch } = usePortfolioPnL(trades, currency);
  const { clearCache, isClearing } = usePriceCache();

  const handleRefresh = async () => {
    await clearCache();
    await refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  // Calculate cashflow totals
  const cashflowData = React.useMemo(() => {
    const totalDeposits = cashflows
      .filter(cf => cf.type === 'deposit')
      .reduce((sum, cf) => sum + cf.amount, 0);
    
    const totalWithdrawals = cashflows
      .filter(cf => cf.type === 'withdrawal')
      .reduce((sum, cf) => sum + cf.amount, 0);
    
    const netCashflow = totalDeposits - totalWithdrawals;
    
    return {
      totalDeposits,
      totalWithdrawals,
      netCashflow
    };
  }, [cashflows]);

  // Calculate manual P&L from non-spot trades (investments)
  const manualPnL = React.useMemo(() => {
    return trades
      .filter(trade => !['spot', 'futures'].includes(trade.category))
      .reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
  }, [trades]);

  // Calculate grand total portfolio value
  const grandTotalData = React.useMemo(() => {
    const spotCurrentValue = portfolioData?.totalCurrentValue || 0;
    const spotInvested = portfolioData?.totalInvested || 0;
    const spotUnrealizedPnL = portfolioData?.totalUnrealizedPnL || 0;
    
    // Calculate non-spot investments value (initial investment + P&L)
    const nonSpotTrades = trades.filter(trade => !['spot', 'futures'].includes(trade.category));
    const nonSpotInvested = nonSpotTrades.reduce((sum, trade) => sum + (trade.price * trade.quantity) + (trade.fees || 0), 0);
    const nonSpotCurrentValue = nonSpotInvested + manualPnL;
    
    // Grand totals
    const totalInvested = spotInvested + nonSpotInvested;
    const totalCurrentValue = spotCurrentValue + nonSpotCurrentValue;
    const totalUnrealizedPnL = spotUnrealizedPnL + manualPnL;
    const totalCash = cashflowData.netCashflow;
    
    // Grand total including cash
    const grandTotalValue = totalCurrentValue + totalCash;
    const totalPnLPercentage = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
    
    return {
      grandTotalValue,
      totalInvested,
      totalCurrentValue,
      totalUnrealizedPnL,
      totalPnLPercentage,
      totalCash,
      spotValue: spotCurrentValue,
      nonSpotValue: nonSpotCurrentValue,
      cashflowData
    };
  }, [portfolioData, manualPnL, cashflowData, trades]);

  if (loading && !portfolioData) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Overview</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading portfolio data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Overview</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || isClearing}
          >
            <RefreshCw className={cn("h-4 w-4", (loading || isClearing) && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">Error loading portfolio data</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = grandTotalData.totalUnrealizedPnL >= 0;

  return (
    <Card className={cn("crypto-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Grand Total Portfolio
          </CardTitle>
          {lastUpdated && (
            <div className="text-xs text-muted-foreground mt-1">
              Updated {lastUpdated.toLocaleTimeString()} (prices refresh every 30min)
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || isClearing}
        >
          <RefreshCw className={cn("h-4 w-4", (loading || isClearing) && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grand Total Value */}
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-2">Total Portfolio Value</div>
          <div className="text-4xl font-bold text-gradient-primary mb-2">
            {formatCurrency(grandTotalData.grandTotalValue)}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={cn(
                "text-sm",
                isPositive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatCurrency(Math.abs(grandTotalData.totalUnrealizedPnL))} ({formatPercentage(grandTotalData.totalPnLPercentage)})
            </Badge>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Spot Holdings</div>
            <div className="text-lg font-semibold">{formatCurrency(grandTotalData.spotValue)}</div>
            <div className="text-xs text-blue-600">Real-time prices</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Investments</div>
            <div className="text-lg font-semibold">{formatCurrency(grandTotalData.nonSpotValue)}</div>
            <div className="text-xs text-green-600">DeFi, LP, etc.</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Cash Balance</div>
            <div className="text-lg font-semibold">{formatCurrency(grandTotalData.totalCash)}</div>
            <div className="text-xs text-yellow-600">Available funds</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
            <div className="text-lg font-semibold">{formatCurrency(grandTotalData.totalInvested)}</div>
            <div className="text-xs text-purple-600">Capital deployed</div>
          </div>
        </div>

        {/* Cashflow Summary */}
        <div className="pt-4 border-t border-border">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cashflow Summary
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Deposits</div>
              <div className="font-semibold text-green-600">
                +{formatCurrency(grandTotalData.cashflowData.totalDeposits)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Withdrawals</div>
              <div className="font-semibold text-red-600">
                -{formatCurrency(grandTotalData.cashflowData.totalWithdrawals)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net Cash</div>
              <div className={cn(
                "font-semibold",
                grandTotalData.cashflowData.netCashflow >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(grandTotalData.cashflowData.netCashflow)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}