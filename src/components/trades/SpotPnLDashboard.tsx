import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { usePortfolioPnL, usePriceCache } from '@/hooks/usePriceData';
import { Trade } from '@/types/database';
import { cn } from '@/lib/utils';

interface SpotPnLDashboardProps {
  trades: Trade[];
  currency: 'USD' | 'PHP';
}

export function SpotPnLDashboard({ trades, currency }: SpotPnLDashboardProps) {
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

  if (loading && !portfolioData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spot Portfolio PnL</CardTitle>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spot Portfolio PnL</CardTitle>
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

  if (!portfolioData || portfolioData.assetBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spot Portfolio PnL</CardTitle>
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
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">No spot holdings found</div>
            <div className="text-xs text-muted-foreground mt-1">
              Add some spot trades to see real-time PnL (prices update every 30 minutes)
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalInvested, totalCurrentValue, totalUnrealizedPnL, totalPnLPercentage, assetBreakdown } = portfolioData;
  const isPositive = totalUnrealizedPnL >= 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spot Portfolio Summary</CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()} (refreshes every 30min)
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || isClearing}
            >
              <RefreshCw className={cn("h-4 w-4", (loading || isClearing) && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total Invested</div>
              <div className="text-lg font-semibold">{formatCurrency(totalInvested)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Current Value</div>
              <div className="text-lg font-semibold">{formatCurrency(totalCurrentValue)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Unrealized PnL</div>
              <div className={cn(
                "text-lg font-semibold flex items-center gap-1",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatCurrency(Math.abs(totalUnrealizedPnL))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">PnL %</div>
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className={cn(
                  "text-sm font-semibold",
                  isPositive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"
                )}
              >
                {formatPercentage(totalPnLPercentage)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Holdings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assetBreakdown.map((asset) => {
              const assetIsPositive = asset.unrealizedPnL >= 0;
              
              return (
                <div key={asset.asset} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{asset.asset}</span>
                      <Badge variant="outline" className="text-xs">
                        {asset.quantity.toFixed(8)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Avg Buy: {formatCurrency(asset.purchasePrice)}</span>
                      <span>Current: {asset.currentPrice ? formatCurrency(asset.currentPrice) : 'N/A'}</span>
                      <span>Invested: {formatCurrency(asset.invested)}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium mb-1">
                      {formatCurrency(asset.currentValue)}
                    </div>
                    <div className={cn(
                      "text-xs flex items-center gap-1",
                      assetIsPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {assetIsPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{formatCurrency(Math.abs(asset.unrealizedPnL))}</span>
                      <span>({formatPercentage(asset.pnlPercentage)})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}