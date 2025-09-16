import { useState, useEffect, useCallback } from 'react';
import { 
  fetchCryptoPrice, 
  fetchMultipleCryptoPrices, 
  calculateSpotPnL, 
  calculatePortfolioPnL,
  SpotPnLCalculation,
  PortfolioSummary 
} from '@/lib/priceApi';
import { Trade } from '@/types/database';

/**
 * Hook for fetching individual cryptocurrency prices
 */
export function useCryptoPrice(symbol: string, currency: 'USD' | 'PHP' = 'USD') {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPrice = await fetchCryptoPrice(symbol, currency);
      setPrice(fetchedPrice);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
      setPrice(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, currency]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    loading,
    error,
    lastUpdated,
    refetch: fetchPrice
  };
}

/**
 * Hook for fetching multiple cryptocurrency prices
 */
export function useMultipleCryptoPrices(symbols: string[], currency: 'USD' | 'PHP' = 'USD') {
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!symbols.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPrices = await fetchMultipleCryptoPrices(symbols, currency);
      setPrices(fetchedPrices);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      setPrices({});
    } finally {
      setLoading(false);
    }
  }, [symbols, currency]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    lastUpdated,
    refetch: fetchPrices
  };
}

/**
 * Hook for calculating PnL for a single spot trade
 */
export function useSpotPnL(
  asset: string,
  purchasePrice: number,
  quantity: number,
  currency: 'USD' | 'PHP' = 'USD',
  fees: number = 0
) {
  const [pnlData, setPnlData] = useState<SpotPnLCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePnL = useCallback(async () => {
    if (!asset || purchasePrice <= 0 || quantity <= 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const calculation = await calculateSpotPnL(asset, purchasePrice, quantity, currency, fees);
      setPnlData(calculation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate PnL');
      setPnlData(null);
    } finally {
      setLoading(false);
    }
  }, [asset, purchasePrice, quantity, currency, fees]);

  useEffect(() => {
    calculatePnL();
  }, [calculatePnL]);

  return {
    pnlData,
    loading,
    error,
    refetch: calculatePnL
  };
}

/**
 * Hook for calculating portfolio PnL from spot trades
 */
export function usePortfolioPnL(trades: Trade[], currency: 'USD' | 'PHP' = 'USD') {
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const calculatePortfolio = useCallback(async () => {
    // Filter only spot trades
    const spotTrades = trades.filter(trade => trade.category === 'spot');
    
    if (!spotTrades.length) {
      setPortfolioData({
        totalInvested: 0,
        totalCurrentValue: 0,
        totalUnrealizedPnL: 0,
        totalPnLPercentage: 0,
        assetBreakdown: []
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const calculation = await calculatePortfolioPnL(spotTrades, currency);
      setPortfolioData(calculation);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate portfolio PnL');
      setPortfolioData(null);
    } finally {
      setLoading(false);
    }
  }, [trades, currency]);

  useEffect(() => {
    calculatePortfolio();
  }, [calculatePortfolio]);

  return {
    portfolioData,
    loading,
    error,
    lastUpdated,
    refetch: calculatePortfolio
  };
}

/**
 * Hook for real-time price updates with auto-refresh
 */
export function useRealTimePrices(
  symbols: string[], 
  currency: 'USD' | 'PHP' = 'USD',
  refreshInterval: number = 1800000 // 30 minutes default (30 * 60 * 1000)
) {
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!symbols.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPrices = await fetchMultipleCryptoPrices(symbols, currency);
      setPrices(fetchedPrices);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, [symbols, currency]);

  useEffect(() => {
    fetchPrices();

    // Set up auto-refresh interval
    const interval = setInterval(fetchPrices, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return {
    prices,
    loading,
    error,
    lastUpdated,
    refetch: fetchPrices
  };
}

/**
 * Hook for managing price cache and manual refresh
 */
export function usePriceCache() {
  const [isClearing, setIsClearing] = useState(false);

  const clearCache = useCallback(async () => {
    setIsClearing(true);
    
    try {
      // Import and call clear function
      const { clearPriceCache } = await import('@/lib/priceApi');
      clearPriceCache();
    } catch (err) {
      console.error('Failed to clear price cache:', err);
    } finally {
      setIsClearing(false);
    }
  }, []);

  return {
    clearCache,
    isClearing
  };
}