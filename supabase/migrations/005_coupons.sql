-- Cupones de descuento
CREATE TABLE IF NOT EXISTS coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  amount         NUMERIC NOT NULL,
  min_order      NUMERIC DEFAULT 0,
  max_uses       INTEGER,
  times_used     INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, code)
);

CREATE INDEX IF NOT EXISTS coupons_restaurant_idx ON coupons(restaurant_id);

-- Incrementar uso de cupón de forma segura
CREATE OR REPLACE FUNCTION increment_coupon_uses(p_restaurant_id UUID, p_code TEXT)
RETURNS void LANGUAGE sql AS $$
  UPDATE coupons SET times_used = times_used + 1
  WHERE restaurant_id = p_restaurant_id AND code = p_code AND is_active = true;
$$;
