ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_combo boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.combo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  component_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  quantity int DEFAULT 1,
  sort_order int DEFAULT 0
);

ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "combo_items_public_read" ON public.combo_items FOR SELECT USING (true);
CREATE POLICY "combo_items_auth_write" ON public.combo_items FOR ALL USING (auth.role() = 'authenticated');
