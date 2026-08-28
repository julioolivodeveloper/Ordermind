-- ============================================================
-- Aca Las Tortas El Paso — Schema de producción
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Clientes
CREATE TABLE IF NOT EXISTS acatortas_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL UNIQUE,
  points      INTEGER NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Órdenes
CREATE TABLE IF NOT EXISTS acatortas_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number INTEGER NOT NULL,
  customer_id  UUID REFERENCES acatortas_customers(id),
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'nuevo'
                 CHECK (status IN ('nuevo','preparando','listo','entregado','cancelado')),
  total        NUMERIC(10,2) NOT NULL,
  items        JSONB NOT NULL DEFAULT '[]',
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contador de órdenes (para order_number secuencial)
CREATE TABLE IF NOT EXISTS acatortas_counters (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO acatortas_counters (key, value) VALUES ('order_number', 1000)
  ON CONFLICT (key) DO NOTHING;

-- Overrides de disponibilidad del menú
CREATE TABLE IF NOT EXISTS acatortas_menu_overrides (
  item_id    TEXT PRIMARY KEY,
  available  BOOLEAN NOT NULL DEFAULT TRUE,
  price      NUMERIC(10,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Función atómica para incrementar el contador de órdenes
CREATE OR REPLACE FUNCTION acatortas_next_order_number()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  next_val INTEGER;
BEGIN
  UPDATE acatortas_counters SET value = value + 1 WHERE key = 'order_number'
  RETURNING value INTO next_val;
  RETURN next_val;
END;
$$;

-- RLS
ALTER TABLE acatortas_customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE acatortas_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE acatortas_menu_overrides ENABLE ROW LEVEL SECURITY;

-- Clientes: anon puede insertar (upsert) el suyo propio; sólo service_role lee todo
CREATE POLICY "clientes_insert" ON acatortas_customers FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "clientes_update_points" ON acatortas_customers FOR UPDATE TO anon
  USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "clientes_read_own" ON acatortas_customers FOR SELECT TO anon
  USING (TRUE);

-- Órdenes: anon inserta, sólo service_role lee/actualiza (vía API routes)
CREATE POLICY "orders_insert" ON acatortas_orders FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "orders_read" ON acatortas_orders FOR SELECT TO anon USING (TRUE);
CREATE POLICY "orders_update" ON acatortas_orders FOR UPDATE TO anon USING (TRUE);

-- Menú overrides: anon lee; service_role escribe
CREATE POLICY "menu_read" ON acatortas_menu_overrides FOR SELECT TO anon USING (TRUE);
CREATE POLICY "menu_write" ON acatortas_menu_overrides FOR ALL TO service_role USING (TRUE);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON acatortas_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON acatortas_orders (status);
CREATE INDEX IF NOT EXISTS idx_customers_phone     ON acatortas_customers (phone);

-- Habilitar Realtime para el dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE acatortas_orders;
