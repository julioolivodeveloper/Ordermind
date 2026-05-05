CREATE TABLE IF NOT EXISTS public.item_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  required boolean DEFAULT false,
  max_selections int DEFAULT 1,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.item_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.item_option_groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  extra_cost numeric(10,2) DEFAULT 0,
  sort_order int DEFAULT 0
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_options jsonb DEFAULT '[]';

ALTER TABLE public.item_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "option_groups_public_read" ON public.item_option_groups FOR SELECT USING (true);
CREATE POLICY "option_groups_auth_write" ON public.item_option_groups FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "item_options_public_read" ON public.item_options FOR SELECT USING (true);
CREATE POLICY "item_options_auth_write" ON public.item_options FOR ALL USING (auth.role() = 'authenticated');
