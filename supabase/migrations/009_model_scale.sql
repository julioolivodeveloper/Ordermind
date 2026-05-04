-- Real-world size in centimeters for each 3D model (default 18cm)
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS model_scale_cm INTEGER DEFAULT 18;
