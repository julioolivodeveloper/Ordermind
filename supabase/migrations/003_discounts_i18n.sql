-- Descuentos e internacionalización en platillos
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent < 100),
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;
