# CoinGecko API Integration Documentation

## Overview

The CryptoFlow Journal now integrates with CoinGecko's free API to provide real-time cryptocurrency pricing and automated PnL calculation for spot holdings.

## Features

### 1. Real-Time Price Fetching
- Fetches current cryptocurrency prices using CoinGecko's free API
- Supports both USD and PHP currencies
- Includes intelligent caching (30-minute cache duration) to minimize API calls and prevent rate limiting
- Conservative rate limiting (3-second delay between calls) to respect CoinGecko's free tier limits

### 2. Automatic PnL Calculation
- Calculates unrealized PnL for spot trades automatically
- Shows current value vs. total invested (including fees)
- Displays percentage gain/loss with visual indicators
- Updates in real-time when prices change

### 3. Portfolio Summary Dashboard
- Overview of total spot portfolio performance
- Breakdown by individual assets
- Real-time portfolio valuation
- Manual refresh capability

## Components

### 1. `priceApi.ts` - Core API Service
**Location:** `src/lib/priceApi.ts`

**Key Functions:**
- `fetchCryptoPrice(symbol, currency)` - Get current price for single asset
- `fetchMultipleCryptoPrices(symbols, currency)` - Batch price fetching
- `calculateSpotPnL(asset, purchasePrice, quantity, currency, fees)` - PnL calculation
- `calculatePortfolioPnL(spotTrades, currency)` - Portfolio-wide PnL analysis

**Features:**
- Automatic symbol-to-CoinGecko ID mapping for 50+ popular cryptocurrencies
- Intelligent caching system (30-minute cache) to reduce API calls
- Conservative rate limiting compliance (3-second delays between calls)
- Error handling and fallback mechanisms

### 2. `usePriceData.ts` - React Hooks
**Location:** `src/hooks/usePriceData.ts`

**Available Hooks:**
- `useCryptoPrice(symbol, currency)` - Single price fetching
- `useMultipleCryptoPrices(symbols, currency)` - Multiple prices
- `useSpotPnL(asset, purchasePrice, quantity, currency, fees)` - Individual trade PnL
- `usePortfolioPnL(trades, currency)` - Portfolio-wide PnL
- `useRealTimePrices(symbols, currency, refreshInterval)` - Auto-refreshing prices

### 3. `SpotPnLDashboard.tsx` - Portfolio Dashboard
**Location:** `src/components/trades/SpotPnLDashboard.tsx`

**Features:**
- Real-time portfolio summary (total invested, current value, PnL)
- Individual asset breakdown with performance metrics
- Visual indicators for gains/losses
- Manual refresh functionality
- Responsive design for mobile/desktop

### 4. `RealTimePriceCell.tsx` - Table Price Display
**Location:** `src/components/trades/RealTimePriceCell.tsx`

**Features:**
- Shows current price with "Live" badge
- Displays real-time PnL for spot trades
- Color-coded gain/loss indicators
- Loading states and error handling

## Usage

### In Trade List
The trade list now shows:
- **Purchase Price**: Original trade price
- **Current Price**: Real-time price from CoinGecko
- **Live PnL**: Automatically calculated for spot trades

### In Portfolio Dashboard
When viewing "All" or "Spot" categories, users see:
- Total portfolio performance summary
- Individual asset performance breakdown
- Real-time valuation updates

### API Rate Limiting
The implementation conservatively respects CoinGecko's free tier limits:
- **Rate Limit**: 30 calls per minute (CoinGecko free tier)
- **Delay**: 3 seconds between API calls for safety margin
- **Caching**: 30-minute cache to minimize redundant calls
- **Batching**: Multiple symbols in single API call when possible
- **Conservative approach**: Longer cache duration prevents API exhaustion

## Supported Cryptocurrencies

The system includes automatic mapping for 50+ popular cryptocurrencies:
- **Major coins**: BTC, ETH, BNB, ADA, DOT, XRP, LTC, BCH
- **DeFi tokens**: LINK, UNI, AAVE, MKR, COMP, YFI, SUSHI, CRV
- **Stablecoins**: USDT, USDC, BUSD, DAI
- **Layer 1s**: MATIC, AVAX, SOL, ATOM, FTM, NEAR, ALGO
- **And many more...**

For cryptocurrencies not in the mapping, the system attempts to use the symbol directly as the CoinGecko ID.

## Error Handling

The system gracefully handles various error scenarios:
- **API unavailable**: Shows "Price unavailable" message
- **Unknown cryptocurrency**: Falls back to symbol-based lookup
- **Network issues**: Displays error message with retry option
- **Rate limiting**: Implements delays and caching to prevent issues

## Testing

A development test panel is available in the trades page (development mode only) to:
- Test individual price fetching
- Verify PnL calculations
- Debug API connectivity issues

## Performance Considerations

- **Extended caching**: 30-minute cache significantly reduces API calls
- **Batching**: Multiple symbols fetched in single API call
- **Conservative rate limiting**: 3-second delays prevent API throttling
- **Lazy loading**: Prices only fetched when components are visible
- **Error boundaries**: Failed price fetches don't break the UI
- **API conservation**: Longer refresh intervals prevent quota exhaustion

## Future Enhancements

Potential improvements for future versions:
1. **WebSocket integration** for real-time price streaming
2. **Historical price charts** using CoinGecko's historical data API
3. **Price alerts** when assets reach target prices
4. **Additional exchanges** for price comparison
5. **Advanced portfolio analytics** with performance metrics

## Configuration

Environment variables (already configured):
```env
# API timeouts and caching
VITE_API_TIMEOUT=30000
VITE_CACHE_DURATION=600000

# Default currency
VITE_DEFAULT_CURRENCY=USD
```

## API Limitations (Free Tier)

- **Rate limit**: 30 calls per minute
- **No historical data**: Only current prices
- **No WebSocket**: Polling-based updates only
- **Basic endpoints**: Limited to simple price queries

For production use with high volume, consider upgrading to CoinGecko's paid API plans for higher rate limits and additional features.