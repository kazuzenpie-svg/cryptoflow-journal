import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube } from 'lucide-react';
import { fetchCryptoPrice, calculateSpotPnL } from '@/lib/priceApi';

export function PriceTestPanel() {
  const [symbol, setSymbol] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testPrice = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const price = await fetchCryptoPrice(symbol, 'USD');
      setResult({ type: 'price', price, symbol });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  };

  const testPnL = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const pnlData = await calculateSpotPnL(symbol, 40000, 0.1, 'USD', 10);
      setResult({ type: 'pnl', data: pnlData, symbol });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate PnL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          CoinGecko API Test
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          Prices cached for 30 minutes • API calls limited to conserve quota
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Enter symbol (e.g., BTC, ETH)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={testPrice} 
            disabled={loading || !symbol}
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Price'}
          </Button>
          <Button 
            onClick={testPnL} 
            disabled={loading || !symbol}
            variant="outline"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test PnL'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded space-y-2">
            {result.type === 'price' && (
              <div>
                <Badge className="mb-2">Price Result</Badge>
                <p className="text-sm">
                  <strong>{result.symbol}:</strong> ${result.price?.toLocaleString() || 'N/A'}
                </p>
              </div>
            )}
            
            {result.type === 'pnl' && result.data && (
              <div>
                <Badge className="mb-2">PnL Result</Badge>
                <div className="text-sm space-y-1">
                  <p><strong>{result.symbol}</strong> (0.1 @ $40,000)</p>
                  <p>Current Price: ${result.data.currentPrice?.toLocaleString()}</p>
                  <p>Current Value: ${result.data.currentValue.toFixed(2)}</p>
                  <p>Invested: ${result.data.totalInvested.toFixed(2)}</p>
                  <p className={result.data.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    PnL: ${result.data.unrealizedPnL.toFixed(2)} ({result.data.pnlPercentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}