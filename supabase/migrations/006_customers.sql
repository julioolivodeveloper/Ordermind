-- Customer tracking per restaurant
CREATE TABLE IF NOT EXISTS customers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email          TEXT,
  name           TEXT,
  phone          TEXT,
  total_orders   INTEGER DEFAULT 0,
  total_spent    NUMERIC DEFAULT 0,
  last_order_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, email)
);

CREATE INDEX IF NOT EXISTS customers_restaurant_idx ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);

-- Link orders to customer record
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Restaurant staff can read their customers
CREATE POLICY "customers_staff_read" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.restaurant_id = customers.restaurant_id
    )
  );

-- Upsert customer on order and link back
CREATE OR REPLACE FUNCTION upsert_customer_from_order(
  p_restaurant_id UUID,
  p_order_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_total NUMERIC
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  IF p_email IS NULL OR p_email = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO customers (restaurant_id, email, name, phone, total_orders, total_spent, last_order_at)
  VALUES (p_restaurant_id, p_email, p_name, p_phone, 1, p_total, now())
  ON CONFLICT (restaurant_id, email) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, customers.name),
    phone = COALESCE(EXCLUDED.phone, customers.phone),
    total_orders = customers.total_orders + 1,
    total_spent = customers.total_spent + p_total,
    last_order_at = now()
  RETURNING id INTO v_customer_id;

  UPDATE orders SET customer_id = v_customer_id WHERE id = p_order_id;

  RETURN v_customer_id;
END;
$$;
