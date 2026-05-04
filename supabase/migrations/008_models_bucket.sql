-- Create models bucket (public, 100MB limit)
insert into storage.buckets (id, name, public, file_size_limit)
values ('models', 'models', true, 104857600)
on conflict (id) do update set public = true, file_size_limit = 104857600;

-- Allow authenticated users to upload/manage models
create policy "Authenticated users can upload models"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'models');

create policy "Authenticated users can update models"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'models');

create policy "Authenticated users can delete models"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'models');

-- Public read access for model URLs
create policy "Public read models"
  on storage.objects for select
  to public
  using (bucket_id = 'models');
