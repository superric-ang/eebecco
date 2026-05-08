-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/hupiajaktgvilomucadg/sql)

-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_data JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_cents INTEGER,
  max_discount_cents INTEGER,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create increment_discount_usage function
CREATE OR REPLACE FUNCTION increment_discount_usage(code TEXT)
RETURNS void AS $$
  UPDATE discount_codes
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE UPPER(code) = UPPER(discount_codes.code);
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable Row Level Security (adjust as needed)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own orders
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to do anything (for API functions)
CREATE POLICY "Service role full access orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access discount_codes" ON discount_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Insert a sample discount code for testing
INSERT INTO discount_codes (code, discount_type, discount_value, description, is_active)
VALUES ('MATCHA10', 'percentage', 10, '10% off your order', true)
ON CONFLICT (code) DO NOTHING;