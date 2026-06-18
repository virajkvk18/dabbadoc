alter table public.profiles enable row level security;
alter table public.uploads enable row level security;
alter table public.receipt_analyses enable row level security;
alter table public.label_analyses enable row level security;
alter table public.food_diaries enable row level security;
alter table public.health_index enable row level security;
alter table public.payments enable row level security;
alter table public.reports enable row level security;
alter table public.family_connections enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Users can read own uploads" on public.uploads;
drop policy if exists "Users can insert own uploads" on public.uploads;
drop policy if exists "Users can update own uploads" on public.uploads;
drop policy if exists "Users can delete own uploads" on public.uploads;

drop policy if exists "Users can read own receipt analyses" on public.receipt_analyses;
drop policy if exists "Users can insert own receipt analyses" on public.receipt_analyses;
drop policy if exists "Users can update own receipt analyses" on public.receipt_analyses;
drop policy if exists "Users can delete own receipt analyses" on public.receipt_analyses;

drop policy if exists "Users can read own label analyses" on public.label_analyses;
drop policy if exists "Users can insert own label analyses" on public.label_analyses;
drop policy if exists "Users can update own label analyses" on public.label_analyses;
drop policy if exists "Users can delete own label analyses" on public.label_analyses;

drop policy if exists "Users can read own food diaries" on public.food_diaries;
drop policy if exists "Users can insert own food diaries" on public.food_diaries;
drop policy if exists "Users can update own food diaries" on public.food_diaries;
drop policy if exists "Users can delete own food diaries" on public.food_diaries;

drop policy if exists "Users can read own health index" on public.health_index;
drop policy if exists "Users can insert own health index" on public.health_index;
drop policy if exists "Users can update own health index" on public.health_index;
drop policy if exists "Users can delete own health index" on public.health_index;

drop policy if exists "Users can read own payments" on public.payments;

drop policy if exists "Users can read own reports" on public.reports;
drop policy if exists "Users can insert own reports" on public.reports;
drop policy if exists "Users can update own reports" on public.reports;
drop policy if exists "Users can delete own reports" on public.reports;

drop policy if exists "Users can read family connections" on public.family_connections;
drop policy if exists "Users can invite family members" on public.family_connections;
drop policy if exists "Users can update family connections" on public.family_connections;
drop policy if exists "Users can delete family connections" on public.family_connections;

drop policy if exists "Users can upload own files" on storage.objects;
drop policy if exists "Users can read own files" on storage.objects;
drop policy if exists "Users can update own files" on storage.objects;
drop policy if exists "Users can delete own files" on storage.objects;

create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read own uploads"
on public.uploads for select
using (auth.uid() = user_id);

create policy "Users can insert own uploads"
on public.uploads for insert
with check (auth.uid() = user_id);

create policy "Users can update own uploads"
on public.uploads for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own uploads"
on public.uploads for delete
using (auth.uid() = user_id);

create policy "Users can read own receipt analyses"
on public.receipt_analyses for select
using (auth.uid() = user_id);

create policy "Users can insert own receipt analyses"
on public.receipt_analyses for insert
with check (
  auth.uid() = user_id
  and (
    upload_id is null
    or exists (
      select 1
      from public.uploads
      where uploads.id = receipt_analyses.upload_id
        and uploads.user_id = auth.uid()
    )
  )
);

create policy "Users can update own receipt analyses"
on public.receipt_analyses for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    upload_id is null
    or exists (
      select 1
      from public.uploads
      where uploads.id = receipt_analyses.upload_id
        and uploads.user_id = auth.uid()
    )
  )
);

create policy "Users can delete own receipt analyses"
on public.receipt_analyses for delete
using (auth.uid() = user_id);

create policy "Users can read own label analyses"
on public.label_analyses for select
using (auth.uid() = user_id);

create policy "Users can insert own label analyses"
on public.label_analyses for insert
with check (
  auth.uid() = user_id
  and (
    upload_id is null
    or exists (
      select 1
      from public.uploads
      where uploads.id = label_analyses.upload_id
        and uploads.user_id = auth.uid()
    )
  )
);

create policy "Users can update own label analyses"
on public.label_analyses for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    upload_id is null
    or exists (
      select 1
      from public.uploads
      where uploads.id = label_analyses.upload_id
        and uploads.user_id = auth.uid()
    )
  )
);

create policy "Users can delete own label analyses"
on public.label_analyses for delete
using (auth.uid() = user_id);

create policy "Users can read own food diaries"
on public.food_diaries for select
using (auth.uid() = user_id);

create policy "Users can insert own food diaries"
on public.food_diaries for insert
with check (auth.uid() = user_id);

create policy "Users can update own food diaries"
on public.food_diaries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own food diaries"
on public.food_diaries for delete
using (auth.uid() = user_id);

create policy "Users can read own health index"
on public.health_index for select
using (auth.uid() = user_id);

create policy "Users can insert own health index"
on public.health_index for insert
with check (auth.uid() = user_id);

create policy "Users can update own health index"
on public.health_index for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own health index"
on public.health_index for delete
using (auth.uid() = user_id);

create policy "Users can read own payments"
on public.payments for select
using (auth.uid() = user_id);

create policy "Users can read own reports"
on public.reports for select
using (auth.uid() = user_id);

create policy "Users can insert own reports"
on public.reports for insert
with check (auth.uid() = user_id);

create policy "Users can update own reports"
on public.reports for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own reports"
on public.reports for delete
using (auth.uid() = user_id);

create policy "Users can read family connections"
on public.family_connections for select
using (
  auth.uid() = owner_user_id
  or auth.uid() = family_member_user_id
  or lower(coalesce(auth.jwt()->>'email', '')) = lower(invited_email)
);

create policy "Users can invite family members"
on public.family_connections for insert
with check (auth.uid() = owner_user_id);

create policy "Users can update family connections"
on public.family_connections for update
using (
  auth.uid() = owner_user_id
  or auth.uid() = family_member_user_id
  or lower(coalesce(auth.jwt()->>'email', '')) = lower(invited_email)
)
with check (
  auth.uid() = owner_user_id
  or auth.uid() = family_member_user_id
  or lower(coalesce(auth.jwt()->>'email', '')) = lower(invited_email)
);

create policy "Users can delete family connections"
on public.family_connections for delete
using (
  auth.uid() = owner_user_id
  or auth.uid() = family_member_user_id
);

create policy "Users can upload own files"
on storage.objects for insert
with check (
  bucket_id = 'dabbadoc-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can read own files"
on storage.objects for select
using (
  bucket_id = 'dabbadoc-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own files"
on storage.objects for update
using (
  bucket_id = 'dabbadoc-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'dabbadoc-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own files"
on storage.objects for delete
using (
  bucket_id = 'dabbadoc-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);
