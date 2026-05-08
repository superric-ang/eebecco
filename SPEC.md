# eebecco V8 Database Schema

## Required Tables

### 1. orders
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  discount_code TEXT,
  total_cents INTEGER NOT NULL DEFAULT 0,
  shipping_data JSONB,
  stripe_session_id TEXT,
  tracking_number TEXT,
  carrier TEXT,
  order_items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. discount_codes
```sql
CREATE TABLE discount_codes (
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
```

### 3. profiles (if not exists)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  mailing_list_opt_in BOOLEAN DEFAULT FALSE,
  mailing_list_subscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Shipping Options

### Singapore (SPX Express)
- Standard: S$3.50 (2-4 business days)
- Express: S$6.50 (1-2 business days)
- Free standard shipping on orders over S$60.00

### International (SingPost)
- Economy: S$12.00 (14-21 business days)
- Priority: S$22.00 (7-12 business days)
- Registered: S$35.00 (7-12 business days, tracking & insurance)

## API Keys Required

### For Deployment
1. `STRIPE_SECRET_KEY` - Stripe API key
2. `SUPABASE_URL` - Supabase project URL
3. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
4. `URL` - Website URL for success/cancel redirects

### Optional (for live tracking)
- SPX Express API key (stored in localStorage as `spx_api_key`)
- SingPost API key (stored in localStorage as `singpost_api_key`)

## Discount Code Fields

| Field | Type | Description |
|-------|------|-------------|
| code | TEXT | Unique code (e.g., "MATCHA10") |
| discount_type | TEXT | "percentage" or "fixed" |
| discount_value | NUMERIC | 10 for 10% or 10.00 for S$10 off |
| min_order_cents | INTEGER | Minimum order amount in cents |
| max_discount_cents | INTEGER | Cap for percentage discounts |
| usage_limit | INTEGER | Max number of uses |
| used_count | INTEGER | Current usage count |
| starts_at | TIMESTAMPTZ | When code becomes active |
| expires_at | TIMESTAMPTZ | Expiration date |
| is_active | BOOLEAN | Enable/disable code |

## Functions

### increment_discount_usage
```sql
CREATE OR REPLACE FUNCTION increment_discount_usage(code TEXT)
RETURNS void AS $$
  UPDATE discount_codes
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE UPPER(code) = UPPER(discount_codes.code);
$$ LANGUAGE sql SECURITY DEFINER;
```