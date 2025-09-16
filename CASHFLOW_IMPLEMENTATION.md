# Cashflow Management Implementation

## Overview
The Cashflow Management System has been implemented to track deposits and withdrawals, providing complete portfolio transparency for both traders and investors.

## Database Schema

### Cashflows Table
```sql
CREATE TABLE IF NOT EXISTS public.cashflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount DECIMAL NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'PHP')),
  source TEXT, -- For deposits (e.g., "Bank Transfer", "Binance", "Coinbase")
  destination TEXT, -- For withdrawals (e.g., "Bank Account", "External Wallet")
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Features
- **Multi-currency support**: USD and PHP
- **Transaction types**: Deposits and withdrawals
- **Source/destination tracking**: Track where money comes from/goes to
- **Transaction dates**: When the cash movement occurred
- **Notes**: Additional context for transactions

## Row Level Security (RLS)

### Policy 1: Trader Access
```sql
CREATE POLICY "Traders can manage their own cashflows" ON public.cashflows
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Policy 2: Investor Access
```sql
CREATE POLICY "Investors can view approved trader cashflows" ON public.cashflows
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bindings b
    WHERE b.investor_id = auth.uid()
    AND b.trader_id = public.cashflows.user_id
    AND b.status = 'approved'
  )
);
```

## Implementation Components

### 1. GrandTotalPortfolio Component
- **Location**: `src/components/dashboard/GrandTotalPortfolio.tsx`
- **Purpose**: Displays comprehensive portfolio overview
- **Features**:
  - Grand total value (trading + investments + net cashflow)
  - Current holdings value
  - Net cash flow summary
  - Total P&L calculations
  - Performance indicators

### 2. Cashflow Page
- **Location**: `src/pages/Cashflow.tsx`
- **Purpose**: Main cashflow management interface
- **Features**:
  - Summary cards (total deposits, withdrawals, net cashflow)
  - Transaction history table
  - Add/edit transaction functionality
  - Real-time updates

### 3. CashflowForm Component
- **Location**: `src/components/cashflow/CashflowForm.tsx`
- **Purpose**: Form for adding/editing cashflow transactions
- **Features**:
  - Transaction type selection (deposit/withdrawal)
  - Amount input with currency support
  - Source/destination tracking
  - Transaction date picker
  - Notes field

### 4. CashflowList Component
- **Location**: `src/components/cashflow/CashflowList.tsx`
- **Purpose**: Display and manage cashflow transactions
- **Features**:
  - Sortable transaction table
  - Edit/delete functionality
  - Color-coded transaction types
  - Responsive design

## Navigation Integration

The cashflow page is accessible through the sidebar navigation:
- **Icon**: DollarSign (from lucide-react)
- **Route**: `/cashflow`
- **Available to**: Both traders and investors
- **Permissions**: Traders can manage, investors can view

## Database Migration

To enable the cashflow functionality, run the provided SQL script in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the complete SQL script
5. Execute the query

## Real-time Features

The cashflows table is configured for real-time updates:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.cashflows;
ALTER TABLE public.cashflows REPLICA IDENTITY FULL;
```

This enables:
- Live updates when transactions are added/modified
- Instant portfolio recalculations
- Real-time investor dashboard updates

## Portfolio Integration

Cashflows are integrated into portfolio calculations:
- **Net Cashflow**: Total deposits minus total withdrawals
- **Grand Total Value**: Trading value + investment value + net cashflow
- **Dashboard Display**: Real-time grand total on trader dashboard
- **Investor Transparency**: Investors see complete portfolio including cash movements

## Usage Examples

### Adding a Deposit
1. Navigate to Cashflow page
2. Click "Add Transaction"
3. Select "Deposit" type
4. Enter amount and currency
5. Specify source (e.g., "Bank Transfer")
6. Set transaction date
7. Add optional notes
8. Save transaction

### Viewing Portfolio Impact
1. Transaction is immediately reflected in net cashflow
2. Grand total portfolio value updates automatically
3. Dashboard shows updated metrics
4. Investors see updated values in real-time

## Benefits

1. **Complete Portfolio Overview**: Combines trading, investments, and cash movements
2. **Transparency**: Investors see full portfolio including cash flows
3. **Real-time Updates**: Instant synchronization across all components
4. **Multi-currency Support**: Supports both USD and PHP transactions
5. **Audit Trail**: Complete transaction history with timestamps
6. **Security**: RLS ensures proper access control

## Future Enhancements

- Export functionality for cashflow reports
- Advanced filtering and search
- Cashflow analytics and trends
- Integration with external banking APIs
- Automated categorization suggestions