-- Add cashflows table to the database
CREATE TABLE IF NOT EXISTS public.cashflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount DECIMAL NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'PHP')),
  source TEXT, -- For deposits
  destination TEXT, -- For withdrawals
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for cashflows
ALTER TABLE public.cashflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Cashflows
CREATE POLICY "Traders can manage their own cashflows" ON public.cashflows
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow investors to view their bound trader's cashflows
CREATE POLICY "Investors can view approved trader cashflows" ON public.cashflows
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bindings b
    WHERE b.investor_id = auth.uid()
    AND b.trader_id = public.cashflows.user_id
    AND b.status = 'approved'
  )
);

-- Add timestamp trigger
CREATE TRIGGER update_cashflows_updated_at
  BEFORE UPDATE ON public.cashflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cashflows;
ALTER TABLE public.cashflows REPLICA IDENTITY FULL;

SELECT 'Cashflows table added successfully!' as message;