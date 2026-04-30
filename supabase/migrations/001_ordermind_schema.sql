-- Ordermind SaaS - Multi-tenant schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- ─── Plans ───────────────────────────────────────────────────────────────────
create table public.plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  price numeric(10,2) default 0,
  max_menu_items integer default 50,
  max_staff integer default 3,
  features jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── Restaurants (tenant core) ───────────────────────────────────────────────
create table public.restaurants (
  id uuid default uuid_generate_v4() primary key,
  slug text not null unique,
  name text not null,
  description text,
  logo_url text,
  cover_url text,
  status text not null default 'pending'
    check (status in ('active', 'demo', 'suspended', 'pending')),
  is_demo boolean default false,
  plan_id uuid references public.plans(id),
  owner_id uuid,

  -- Branding
  primary_color text default '#f97316',
  secondary_color text default '#1f2937',

  -- Contact
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text default 'MX',
  website text,

  -- Social
  instagram text,
  facebook text,
  whatsapp text,

  -- Settings
  timezone text default 'America/Mexico_City',
  language text default 'es',
  currency text default 'MXN',

  -- Operations
  pickup_enabled boolean default true,
  delivery_enabled boolean default false,
  dine_in_enabled boolean default false,

  -- Delivery
  delivery_fee numeric(10,2) default 0,
  min_order_amount numeric(10,2) default 0,

  -- Taxes
  tax_rate numeric(5,4) default 0,
  tax_name text default 'IVA',

  -- Hours
  business_hours jsonb default '{}',

  -- Domain
  custom_domain text unique,

  -- Admin notes
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Profiles (extends auth.users) ──────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'customer'
    check (role in ('super_admin', 'restaurant_owner', 'staff', 'customer')),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Menu Categories ─────────────────────────────────────────────────────────
create table public.menu_categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  icon text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(restaurant_id, slug)
);

-- ─── Menu Items ──────────────────────────────────────────────────────────────
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  is_popular boolean default false,
  is_spicy boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Item Ingredients ────────────────────────────────────────────────────────
create table public.item_ingredients (
  id uuid default uuid_generate_v4() primary key,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  is_default boolean default true,
  extra_cost numeric(10,2) default 0,
  sort_order integer default 0
);

-- ─── Orders ──────────────────────────────────────────────────────────────────
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_number integer not null default 1,
  status text not null default 'new'
    check (status in ('new','confirmed','preparing','ready','on_the_way','completed','cancelled')),
  order_type text not null default 'pickup'
    check (order_type in ('pickup','delivery','dine_in')),

  -- Customer
  customer_name text not null,
  customer_email text,
  customer_phone text,

  -- Delivery
  delivery_address jsonb,

  -- Financials
  subtotal numeric(10,2) not null default 0,
  tax_amount numeric(10,2) default 0,
  delivery_fee numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  total numeric(10,2) not null default 0,

  -- Payment
  payment_method text default 'cash'
    check (payment_method in ('cash','card','stripe','paypal')),
  payment_status text default 'pending'
    check (payment_status in ('pending','paid','refunded','failed')),
  payment_intent_id text,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Order Items ─────────────────────────────────────────────────────────────
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  item_price numeric(10,2) not null,
  quantity integer not null default 1,
  modifications jsonb default '[]',
  notes text,
  subtotal numeric(10,2) not null
);

-- ─── Payment Connections ─────────────────────────────────────────────────────
create table public.payment_connections (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  provider text not null check (provider in ('stripe','paypal')),
  account_id text,
  publishable_key text,
  is_active boolean default false,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  unique(restaurant_id, provider)
);

-- ─── Triggers: updated_at ────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger restaurants_updated_at before update on public.restaurants
  for each row execute function public.handle_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.handle_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

-- ─── Trigger: auto-create profile on signup ──────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Function: next order number per restaurant ───────────────────────────────
create or replace function public.next_order_number(p_restaurant_id uuid)
returns integer language plpgsql as $$
declare n integer;
begin
  select coalesce(max(order_number), 0) + 1 into n
  from public.orders where restaurant_id = p_restaurant_id;
  return n;
end;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.plans enable row level security;
alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_ingredients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_connections enable row level security;

-- Plans: public read
create policy "plans_public_read" on public.plans for select using (true);

-- Profiles: own read, super_admin full access
create policy "profiles_own_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_super_admin_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );
create policy "profiles_own_update" on public.profiles
  for update using (auth.uid() = id);

-- Restaurants: super_admin full, owner read/update own, public read active
create policy "restaurants_super_admin_all" on public.restaurants
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );
create policy "restaurants_staff_read" on public.restaurants
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.restaurant_id = restaurants.id)
  );
create policy "restaurants_owner_update" on public.restaurants
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.restaurant_id = restaurants.id and p.role = 'restaurant_owner')
  );
create policy "restaurants_public_read" on public.restaurants
  for select using (status in ('active','demo'));

-- Menu categories
create policy "menu_categories_public_read" on public.menu_categories
  for select using (true);
create policy "menu_categories_staff_write" on public.menu_categories
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and (p.restaurant_id = menu_categories.restaurant_id or p.role = 'super_admin') and p.role in ('super_admin','restaurant_owner','staff'))
  );

-- Menu items
create policy "menu_items_public_read" on public.menu_items
  for select using (true);
create policy "menu_items_staff_write" on public.menu_items
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and (p.restaurant_id = menu_items.restaurant_id or p.role = 'super_admin') and p.role in ('super_admin','restaurant_owner','staff'))
  );

-- Ingredients
create policy "ingredients_public_read" on public.item_ingredients
  for select using (true);
create policy "ingredients_staff_write" on public.item_ingredients
  for all using (
    exists (
      select 1 from public.profiles p
      join public.menu_items mi on mi.id = item_ingredients.menu_item_id
      where p.id = auth.uid() and (p.restaurant_id = mi.restaurant_id or p.role = 'super_admin')
    )
  );

-- Orders
create policy "orders_public_insert" on public.orders
  for insert with check (true);
create policy "orders_public_own_read" on public.orders
  for select using (true);
create policy "orders_staff_update" on public.orders
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and (p.restaurant_id = orders.restaurant_id or p.role = 'super_admin'))
  );

-- Order items
create policy "order_items_public_insert" on public.order_items
  for insert with check (true);
create policy "order_items_read" on public.order_items
  for select using (true);

-- Payment connections
create policy "payment_connections_staff" on public.payment_connections
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and (p.restaurant_id = payment_connections.restaurant_id or p.role = 'super_admin'))
  );

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index on public.restaurants(slug);
create index on public.restaurants(status);
create index on public.restaurants(owner_id);
create index on public.profiles(restaurant_id);
create index on public.profiles(role);
create index on public.menu_categories(restaurant_id);
create index on public.menu_items(restaurant_id);
create index on public.menu_items(category_id);
create index on public.item_ingredients(menu_item_id);
create index on public.orders(restaurant_id);
create index on public.orders(status);
create index on public.orders(created_at desc);
create index on public.order_items(order_id);

-- ─── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.orders;

-- ─── Seed: plans ─────────────────────────────────────────────────────────────
insert into public.plans (name, slug, price, max_menu_items, max_staff, features) values
  ('Demo',       'demo',       0,   20,  1,  '{"watermark":true,"custom_domain":false}'),
  ('Básico',     'basic',      299, 50,  3,  '{"watermark":false,"custom_domain":false}'),
  ('Pro',        'pro',        599, 200, 10, '{"watermark":false,"custom_domain":true}'),
  ('Enterprise', 'enterprise', 999, -1,  -1, '{"watermark":false,"custom_domain":true,"white_label":true}');

-- ─── AFTER RUNNING: set yourself as super_admin ───────────────────────────────
-- 1. Create your account via the /login page
-- 2. Run this in the SQL editor (replace with your user ID):
--    UPDATE public.profiles SET role = 'super_admin' WHERE id = '<your-user-id>';
-- Or find your ID with:
--    SELECT id, email FROM auth.users WHERE email = 'jojulioneto1@gmail.com';
