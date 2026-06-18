create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_premium boolean not null default false,
  plan text not null default 'free',
  trial_start timestamptz not null default now(),
  trial_end timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_url text,
  file_type text,
  source_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.receipt_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  upload_id uuid references public.uploads(id) on delete set null,
  extracted_text text,
  detected_items jsonb not null default '[]',
  risk_flags jsonb not null default '[]',
  health_score integer not null default 0,
  cost_summary jsonb not null default '{}',
  swaps jsonb not null default '[]',
  ai_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.label_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  upload_id uuid references public.uploads(id) on delete set null,
  product_name text,
  ingredients jsonb not null default '[]',
  nutrition jsonb not null default '{}',
  label_truth_score integer not null default 0,
  warnings jsonb not null default '[]',
  better_alternatives jsonb not null default '[]',
  ai_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.food_diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  diary_text text not null,
  calories_estimate integer,
  protein_estimate integer,
  good_items jsonb not null default '[]',
  risky_items jsonb not null default '[]',
  suggestions jsonb not null default '[]',
  daily_score integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.health_index (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0,
  score_breakdown jsonb not null default '{}',
  streak_count integer not null default 0,
  badges jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text not null default 'created',
  amount integer not null default 0,
  plan text not null default 'premium',
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_url text,
  report_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.family_connections (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  family_member_user_id uuid references public.profiles(id) on delete cascade,
  invited_email text not null,
  relationship text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  rejected_at timestamptz,
  revoked_at timestamptz,
  check (owner_user_id <> family_member_user_id)
);

create table if not exists public.health_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age integer,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  activity_level text,
  sleep_hours numeric,
  sleep_quality text,
  water_glasses integer,
  dietary_preference text,
  allergies jsonb not null default '[]',
  medical_conditions jsonb not null default '[]',
  health_goals jsonb not null default '[]',
  custom_goals jsonb not null default '[]',
  women_health jsonb not null default '{"enabled": false, "cravings": []}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  weight_kg numeric,
  mood text,
  energy_level text,
  sleep_hours numeric,
  cravings jsonb not null default '[]',
  cycle_phase text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists uploads_user_id_idx on public.uploads (user_id);
create index if not exists receipt_analyses_user_upload_idx on public.receipt_analyses (user_id, upload_id);
create index if not exists label_analyses_user_upload_idx on public.label_analyses (user_id, upload_id);
create index if not exists food_diaries_user_id_idx on public.food_diaries (user_id);
create index if not exists health_index_user_id_idx on public.health_index (user_id);
create unique index if not exists payments_razorpay_order_id_unique
  on public.payments (razorpay_order_id)
  where razorpay_order_id is not null;
create index if not exists payments_user_order_idx on public.payments (user_id, razorpay_order_id);
create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists family_connections_owner_idx on public.family_connections (owner_user_id, status);
create index if not exists family_connections_member_idx on public.family_connections (family_member_user_id, status);
create index if not exists family_connections_invited_email_idx on public.family_connections (lower(invited_email), status);
create unique index if not exists family_connections_unique_active
  on public.family_connections (owner_user_id, invited_email)
  where status in ('pending', 'accepted');
create index if not exists wellness_logs_user_date_idx on public.wellness_logs (user_id, log_date desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('dabbadoc-uploads', 'dabbadoc-uploads', false)
on conflict (id) do update set public = false;
