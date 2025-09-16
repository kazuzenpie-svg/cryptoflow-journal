/**
 * CoinGecko API integration for cryptocurrency price fetching
 * Using the free API with rate limiting considerations
 */

// CoinGecko Free API base URL
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Rate limiting - free tier allows 30 calls per minute
// With 30-minute caching, we can afford slightly longer delays for better reliability
const RATE_LIMIT_DELAY = 3000; // 3 seconds between calls for better rate limiting

// Cache to avoid excessive API calls
interface PriceCache {
  [key: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};
const CACHE_DURATION = 1800000; // 30 minutes cache (30 * 60 * 1000)

// Common cryptocurrency symbol mappings to CoinGecko IDs
const SYMBOL_TO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'XRP': 'ripple',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BUSD': 'binance-usd',
  'DAI': 'dai',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'SOL': 'solana',
  'ATOM': 'cosmos',
  'FTM': 'fantom',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'THETA': 'theta-token',
  'TRX': 'tron',
  'EOS': 'eos',
  'AAVE': 'aave',
  'MKR': 'maker',
  'COMP': 'compound-governance-token',
  'YFI': 'yearn-finance',
  'SUSHI': 'sushi',
  'CRV': 'curve-dao-token',
  'SNX': 'synthetix-network-token',
  '1INCH': '1inch',
  'BAL': 'balancer',
  'ZRX': '0x',
  'KNC': 'kyber-network-crystal',
  'LRC': 'loopring',
  'REN': 'republic-protocol',
  'BAND': 'band-protocol',
  'STORJ': 'storj',
  'ANT': 'aragon',
  'REP': 'augur',
  'ZEC': 'zcash',
  'XMR': 'monero',
  'DASH': 'dash',
  'DCR': 'decred',
  'ZIL': 'zilliqa'
};

/**
 * Convert cryptocurrency symbol to CoinGecko ID
 */
function symbolToCoinGeckoId(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  return SYMBOL_TO_ID_MAP[upperSymbol] || symbol.toLowerCase();
}

/**
 * Add delay to respect rate limits
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if cached price is still valid
 */
function getCachedPrice(symbol: string): number | null {
  const cacheKey = symbol.toUpperCase();
  const cached = priceCache[cacheKey];
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.price;
  }
  
  return null;
}

/**
 * Cache price data
 */
function setCachedPrice(symbol: string, price: number): void {
  const cacheKey = symbol.toUpperCase();
  priceCache[cacheKey] = {
    price,
    timestamp: Date.now()
  };
}

/**
 * Fetch current price for a single cryptocurrency
 */
export async function fetchCryptoPrice(
  symbol: string, 
  currency: 'USD' | 'PHP' = 'USD'
): Promise<number | null> {
  try {
    // Check cache first
    const cacheKey = `${symbol.toUpperCase()}_${currency}`;
    const cachedPrice = getCachedPrice(cacheKey);
    if (cachedPrice !== null) {
      console.log(`📱 Using cached price for ${symbol}: ${cachedPrice} ${currency} (cache expires in ${Math.round((CACHE_DURATION - (Date.now() - priceCache[cacheKey].timestamp)) / 60000)} minutes)`);
      return cachedPrice;
    }

    const coinId = symbolToCoinGeckoId(symbol);
    const currencyParam = currency.toLowerCase();
    
    const url = `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=${currencyParam}`;
    
    console.log(`📡 Fetching price for ${symbol} (${coinId}) in ${currency}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data[coinId] || !data[coinId][currencyParam]) {
      console.warn(`⚠️ No price data found for ${symbol} (${coinId}) in ${currency}`);
      return null;
    }
    
    const price = data[coinId][currencyParam];
    
    // Cache the result
    setCachedPrice(cacheKey, price);
    
    console.log(`✅ Successfully fetched ${symbol} price: ${price} ${currency} (cached for 30 minutes)`);
    
    // Add delay to respect rate limits
    await delay(RATE_LIMIT_DELAY);
    
    return price;
    
  } catch (error) {
    console.error(`❌ Error fetching price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch current prices for multiple cryptocurrencies
 */
export async function fetchMultipleCryptoPrices(
  symbols: string[], 
  currency: 'USD' | 'PHP' = 'USD'
): Promise<Record<string, number | null>> {
  try {
    const results: Record<string, number | null> = {};
    
    // Check cache for all symbols first
    const uncachedSymbols: string[] = [];
    
    for (const symbol of symbols) {
      const cacheKey = `${symbol.toUpperCase()}_${currency}`;
      const cachedPrice = getCachedPrice(cacheKey);
      if (cachedPrice !== null) {
        results[symbol.toUpperCase()] = cachedPrice;
        console.log(`📱 Using cached price for ${symbol}: ${cachedPrice} ${currency} (cache expires in ${Math.round((CACHE_DURATION - (Date.now() - priceCache[cacheKey].timestamp)) / 60000)} minutes)`);
      } else {
        uncachedSymbols.push(symbol);
      }
    }
    
    if (uncachedSymbols.length === 0) {
      return results;
    }
    
    // Convert symbols to CoinGecko IDs
    const coinIds = uncachedSymbols.map(symbolToCoinGeckoId);
    const currencyParam = currency.toLowerCase();
    
    const url = `${COINGECKO_API_BASE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${currencyParam}`;
    
    console.log(`📡 Fetching prices for ${uncachedSymbols.length} cryptocurrencies in ${currency}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Map results back to original symbols
    for (let i = 0; i < uncachedSymbols.length; i++) {
      const symbol = uncachedSymbols[i];
      const coinId = coinIds[i];
      
      if (data[coinId] && data[coinId][currencyParam]) {
        const price = data[coinId][currencyParam];
        results[symbol.toUpperCase()] = price;
        
        // Cache the result
        const cacheKey = `${symbol.toUpperCase()}_${currency}`;
        setCachedPrice(cacheKey, price);
        
        console.log(`✅ Fetched ${symbol} price: ${price} ${currency} (cached for 30 minutes)`);
      } else {
        results[symbol.toUpperCase()] = null;
        console.warn(`⚠️ No price data found for ${symbol} (${coinId}) in ${currency}`);
      }
    }
    
    // Add delay to respect rate limits
    await delay(RATE_LIMIT_DELAY);
    
    return results;
    
  } catch (error) {
    console.error(`❌ Error fetching multiple crypto prices:`, error);
    // Return null for all symbols on error
    return symbols.reduce((acc, symbol) => {
      acc[symbol.toUpperCase()] = null;
      return acc;
    }, {} as Record<string, number | null>);
  }
}

/**
 * Calculate PnL for a spot trade
 */
export interface SpotPnLCalculation {
  currentValue: number;
  totalInvested: number;
  unrealizedPnL: number;
  pnlPercentage: number;
  currentPrice: number | null;
}

export async function calculateSpotPnL(
  asset: string,
  purchasePrice: number,
  quantity: number,
  currency: 'USD' | 'PHP' = 'USD',
  fees: number = 0
): Promise<SpotPnLCalculation | null> {
  try {
    const currentPrice = await fetchCryptoPrice(asset, currency);
    
    if (currentPrice === null) {
      console.warn(`⚠️ Cannot calculate PnL for ${asset}: Current price unavailable`);
      return null;
    }
    
    const totalInvested = (purchasePrice * quantity) + fees;
    const currentValue = currentPrice * quantity;
    const unrealizedPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
    
    const result: SpotPnLCalculation = {
      currentValue,
      totalInvested,
      unrealizedPnL,
      pnlPercentage,
      currentPrice
    };
    
    console.log(`📊 PnL calculated for ${asset}:`, {
      quantity,
      purchasePrice,
      currentPrice,
      unrealizedPnL: unrealizedPnL.toFixed(2),
      pnlPercentage: pnlPercentage.toFixed(2) + '%'
    });
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error calculating PnL for ${asset}:`, error);
    return null;
  }
}

/**
 * Get portfolio summary for all spot holdings
 */
export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  totalPnLPercentage: number;
  assetBreakdown: Array<{
    asset: string;
    quantity: number;
    purchasePrice: number;
    currentPrice: number | null;
    currentValue: number;
    invested: number;
    unrealizedPnL: number;
    pnlPercentage: number;
  }>;
}

export async function calculatePortfolioPnL(
  spotTrades: Array<{
    asset: string;
    price: number;
    quantity: number;
    fees?: number;
    details?: { buy_sell?: 'buy' | 'sell' };
  }>,
  currency: 'USD' | 'PHP' = 'USD'
): Promise<PortfolioSummary | null> {
  try {
    // Group trades by asset and calculate net positions
    const positions: Record<string, {
      totalQuantity: number;
      totalCost: number;
      totalFees: number;
    }> = {};
    
    for (const trade of spotTrades) {
      const asset = trade.asset.toUpperCase();
      const isBuy = !trade.details?.buy_sell || trade.details.buy_sell === 'buy';
      const quantity = isBuy ? trade.quantity : -trade.quantity;
      const cost = trade.price * Math.abs(trade.quantity);
      const fees = trade.fees || 0;
      
      if (!positions[asset]) {
        positions[asset] = {
          totalQuantity: 0,
          totalCost: 0,
          totalFees: 0
        };
      }
      
      positions[asset].totalQuantity += quantity;
      positions[asset].totalCost += isBuy ? cost : -cost;
      positions[asset].totalFees += fees;
    }
    
    // Filter out zero or negative positions
    const activePositions = Object.entries(positions).filter(
      ([_, pos]) => pos.totalQuantity > 0
    );
    
    if (activePositions.length === 0) {
      return {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalUnrealizedPnL: 0,
        totalPnLPercentage: 0,
        assetBreakdown: []
      };
    }
    
    // Get current prices for all assets
    const assets = activePositions.map(([asset]) => asset);
    const currentPrices = await fetchMultipleCryptoPrices(assets, currency);
    
    // Calculate PnL for each position
    const assetBreakdown = activePositions.map(([asset, position]) => {
      const currentPrice = currentPrices[asset];
      const avgPurchasePrice = position.totalCost / position.totalQuantity;
      const invested = position.totalCost + position.totalFees;
      const currentValue = currentPrice ? currentPrice * position.totalQuantity : 0;
      const unrealizedPnL = currentValue - invested;
      const pnlPercentage = invested > 0 ? (unrealizedPnL / invested) * 100 : 0;
      
      return {
        asset,
        quantity: position.totalQuantity,
        purchasePrice: avgPurchasePrice,
        currentPrice,
        currentValue,
        invested,
        unrealizedPnL,
        pnlPercentage
      };
    });
    
    // Calculate portfolio totals
    const totalInvested = assetBreakdown.reduce((sum, item) => sum + item.invested, 0);
    const totalCurrentValue = assetBreakdown.reduce((sum, item) => sum + item.currentValue, 0);
    const totalUnrealizedPnL = totalCurrentValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
    
    const portfolioSummary: PortfolioSummary = {
      totalInvested,
      totalCurrentValue,
      totalUnrealizedPnL,
      totalPnLPercentage,
      assetBreakdown
    };
    
    console.log(`📊 Portfolio PnL calculated:`, {
      totalInvested: totalInvested.toFixed(2),
      totalCurrentValue: totalCurrentValue.toFixed(2),
      totalUnrealizedPnL: totalUnrealizedPnL.toFixed(2),
      totalPnLPercentage: totalPnLPercentage.toFixed(2) + '%'
    });
    
    return portfolioSummary;
    
  } catch (error) {
    console.error(`❌ Error calculating portfolio PnL:`, error);
    return null;
  }
}

/**
 * Clear price cache (useful for testing or manual refresh)
 */
export function clearPriceCache(): void {
  Object.keys(priceCache).forEach(key => delete priceCache[key]);
  console.log('🗑️ Price cache cleared (30-minute cache reset)');
}