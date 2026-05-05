ALTER TABLE square_connections ADD COLUMN IF NOT EXISTS location_id text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS square_item_id text;
