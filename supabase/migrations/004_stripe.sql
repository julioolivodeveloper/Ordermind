-- Integración Stripe por restaurante
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connected       BOOLEAN DEFAULT false;
