-- Delivery zip codes + loyalty settings on restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS delivery_zip_codes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_points_per_dollar NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS loyalty_redemption_points INTEGER DEFAULT 100;

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  badge_text TEXT,
  image_url TEXT,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promotions_restaurant_id_idx ON promotions(restaurant_id);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON reviews(restaurant_id);

-- Loyalty points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  points INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, customer_phone)
);

CREATE INDEX IF NOT EXISTS loyalty_points_restaurant_phone_idx ON loyalty_points(restaurant_id, customer_phone);
