-- 3D model URLs per menu item
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS model_url      TEXT,  -- GLB (web + Android AR)
  ADD COLUMN IF NOT EXISTS model_usdz_url TEXT;  -- USDZ (iOS AR via Quick Look)
