-- Acá Las Tortas El Paso — Supabase Schema
-- Run this in the Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- ORDERS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  items jsonb not null,
  total numeric(10, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  payment_intent_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- MENU ITEMS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null,
  category text not null
    check (category in ('tortas', 'tacos', 'hamburguesas', 'burritos')),
  image text not null default '',
  available boolean not null default true,
  popular boolean not null default false,
  spicy boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at trigger (shared)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.orders enable row level security;
alter table public.menu_items enable row level security;

-- Orders: service role full access, anon read
create policy "orders_service_all" on public.orders for all to service_role using (true) with check (true);
create policy "orders_anon_read"   on public.orders for select to anon using (true);

-- Menu items: service role full access, anon read
create policy "menu_service_all" on public.menu_items for all to service_role using (true) with check (true);
create policy "menu_anon_read"   on public.menu_items for select to anon using (true);

-- ─────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.menu_items;

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index orders_status_idx     on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);
create index menu_category_idx     on public.menu_items(category);
create index menu_sort_idx         on public.menu_items(sort_order, created_at);

-- ─────────────────────────────────────────────
-- SEED — menú inicial
-- ─────────────────────────────────────────────
insert into public.menu_items (name, description, price, category, image, available, popular, spicy, sort_order) values
  ('Torta Cubana',       'Milanesa, jamón, queso, chorizo, huevo, aguacate, jalapeños y mayonesa en telera crujiente',        14.99, 'tortas',       '', true,  true,  false, 1),
  ('Torta de Milanesa',  'Milanesa de res empanizada, lechuga, tomate, aguacate, frijoles y crema',                            12.99, 'tortas',       '', true,  false, false, 2),
  ('Torta de Carnitas',  'Carnitas de cerdo jugosas, cebolla, cilantro, salsa verde y aguacate en bolillo',                    13.49, 'tortas',       '', true,  true,  true,  3),
  ('Torta de Pollo',     'Pollo a la plancha, queso oaxaca, chiles en vinagre, jitomate y mayonesa especial',                  12.49, 'tortas',       '', true,  false, false, 4),
  ('Taco al Pastor',     'Carne de cerdo marinada con achiote, piña, cebolla y cilantro en tortilla de maíz',                   3.99, 'tacos',        '', true,  true,  true,  5),
  ('Taco de Birria',     'Birria de res estilo Jalisco con consomé para remojar, cebolla y cilantro',                           4.99, 'tacos',        '', true,  true,  false, 6),
  ('Taco de Carne Asada','Carne asada a las brasas, guacamole, pico de gallo en tortilla de maíz',                             4.49, 'tacos',        '', true,  false, false, 7),
  ('Taco de Tripa',      'Tripa de res bien doradita, cebolla, cilantro y salsa roja de la casa',                              3.49, 'tacos',        '', true,  false, true,  8),
  ('Burger Acá Las Tortas','Doble carne angus, doble queso americano, bacon crujiente, cebolla caramelizada y salsa especial', 16.99, 'hamburguesas', '', true,  true,  false, 9),
  ('Burger Clásica',     'Carne angus 1/2 lb, queso cheddar, lechuga, tomate, cebolla y pepinillos',                          13.99, 'hamburguesas', '', true,  false, false, 10),
  ('Burger Jalapeño',    'Carne angus, queso pepper jack, jalapeños frescos, chipotle mayo y aros de cebolla',                 14.99, 'hamburguesas', '', true,  false, true,  11),
  ('Super Burrito',      'Arroz, frijoles, carne asada, guacamole, pico de gallo, crema y queso en tortilla XL',              15.99, 'burritos',     '', true,  true,  false, 12),
  ('Burrito al Pastor',  'Al pastor, arroz, frijoles, piña, cebolla morada y salsa verde en tortilla de harina',              14.99, 'burritos',     '', true,  false, true,  13),
  ('Burrito Veggie',     'Arroz, frijoles negros, verduras salteadas, guacamole, queso y crema',                              12.99, 'burritos',     '', true,  false, false, 14)
on conflict do nothing;
