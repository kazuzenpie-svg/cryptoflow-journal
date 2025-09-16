import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useCryptoPrice } from '@/hooks/usePriceData';
import { cn } from '@/lib/utils';

interface RealTimePriceCellProps {
  asset: string;
  currency: 'USD' | 'PHP';
  purchasePrice?: number;
  quantity?: number;
  category?: string;
  className?: string;
}

export function RealTimePriceCell({ 
  asset, 
  currency, 
  purchasePrice, 
  quantity, 
  category,
  className 
}: RealTimePriceCellProps) {
  const { price, loading, error } = useCryptoPrice(asset, currency);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Only show PnL calculation for spot trades
  const showPnL = category === 'spot' && purchasePrice && quantity && price;
  
  let pnlData = null;
  if (showPnL) {
    const currentValue = price * quantity;
    const invested = purchasePrice * quantity;
    const unrealizedPnL = currentValue - invested;
    const pnlPercentage = invested > 0 ? (unrealizedPnL / invested) * 100 : 0;
    
    pnlData = {
      unrealizedPnL,
      pnlPercentage,
      isPositive: unrealizedPnL >= 0
    };
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error || price === null) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        Price unavailable
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formatCurrency(price)}</span>
        <Badge variant="outline" className="text-xs">30min</Badge>
      </div>
      
      {pnlData && (
        <div className={cn(
          "flex items-center gap-1 text-xs",
          pnlData.isPositive ? "text-green-600" : "text-red-600"
        )}>
          {pnlData.isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>
            {formatCurrency(Math.abs(pnlData.unrealizedPnL))} 
            ({pnlData.pnlPercentage >= 0 ? '+' : ''}{pnlData.pnlPercentage.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
}