-- Plataforma Letícia — schema MVP
-- Execute no Supabase SQL Editor após habilitar extensões.

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'patient' check (role in ('patient', 'nutritionist')),
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Patients (CPF vincula conta; leads da waitlist podem ficar sem CPF até o signup)
-- Requer public.waitlist (supabase/schema.sql) antes deste arquivo.
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  cpf text,
  cpf_hash text,
  full_name text not null,
  phone text not null,
  goal text not null check (
    goal in (
      'Emagrecimento',
      'Cirurgia Bariátrica',
      'Saúde intestinal',
      'Medicina de precisão',
      'Nutrição clínica',
      'Hipertrofia'
    )
  ),
  user_id uuid unique references auth.users (id) on delete set null,
  waitlist_id bigint references public.waitlist (id) on delete set null,
  source text not null default 'signup' check (source in ('signup', 'waitlist', 'admin')),
  sex text check (sex in ('male', 'female')),
  birth_date date,
  height_cm numeric check (height_cm > 0 and height_cm < 300),
  body_fat_percent numeric check (body_fat_percent >= 3 and body_fat_percent <= 70),
  activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'heavy', 'very_heavy')
  ),
  bmr_formula text default 'mifflin' check (
    bmr_formula in ('mifflin', 'harris', 'fao_who', 'katch')
  ),
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text check (char_length(address_state) <= 2),
  address_zip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_cpf_required_with_account check (user_id is null or cpf is not null)
);

create unique index if not exists patients_cpf_unique on public.patients (cpf) where cpf is not null;
create unique index if not exists patients_phone_unique on public.patients (phone);
create index if not exists patients_user_id_idx on public.patients (user_id);
create index if not exists patients_cpf_hash_idx on public.patients (cpf_hash);
create index if not exists patients_waitlist_id_idx on public.patients (waitlist_id);

-- Availability
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_min smallint not null default 60,
  buffer_min smallint not null default 15,
  type text not null default 'consultation' check (type in ('consultation', 'return')),
  status text not null default 'scheduled' check (
    status in ('scheduled', 'completed', 'cancelled', 'no_show')
  ),
  notes text,
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'waived')
  ),
  payment_method_id uuid,
  amount_cents integer not null default 0,
  google_event_id text,
  meet_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_starts_at_idx on public.appointments (starts_at);
create index if not exists appointments_patient_id_idx on public.appointments (patient_id);

-- Payment settings
create table if not exists public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  consultation_price_cents integer not null default 0,
  return_price_cents integer,
  currency text not null default 'BRL',
  instructions text,
  cancellation_policy text,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('pix', 'transfer', 'card_in_person', 'cash', 'other')),
  label text not null,
  details jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.appointments
  add constraint appointments_payment_method_id_fkey
  foreign key (payment_method_id) references public.payment_methods (id) on delete set null;

-- Google Calendar
create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.profiles (id) on delete cascade,
  calendar_id text not null default 'primary',
  refresh_token_encrypted text not null,
  connected_at timestamptz not null default now(),
  unique (nutritionist_id)
);

-- Diets
create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  title text not null,
  starts_at date,
  ends_at date,
  notes text,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  source text not null default 'manual' check (source in ('manual', 'fatsecret_csv', 'fatsecret_pdf')),
  source_pdf_path text,
  extraction_summary text,
  extraction_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diet_meals (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans (id) on delete cascade,
  name text not null,
  sort_order smallint not null default 0
);

create table if not exists public.diet_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.diet_meals (id) on delete cascade,
  source text not null check (source in ('taco', 'tbca', 'usda', 'off', 'fatsecret', 'fatsecret_csv', 'fatsecret_pdf', 'custom')),
  external_id text,
  label text not null,
  quantity numeric not null default 1,
  portion_g numeric not null default 100,
  nutrition_snapshot jsonb
);

create table if not exists public.diet_supplements (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans (id) on delete cascade,
  sort_order smallint not null default 0,
  product_name text not null,
  dosage text not null,
  posology text not null,
  notes text
);

create table if not exists public.diet_referrals (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans (id) on delete cascade,
  sort_order smallint not null default 0,
  specialty text not null,
  professional_name text,
  reason text not null,
  urgency text not null default 'routine' check (urgency in ('routine', 'priority')),
  notes text
);

-- Evolution
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  weight_kg numeric,
  waist_cm numeric,
  hip_cm numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  storage_path text not null,
  taken_at timestamptz not null default now(),
  caption text,
  visibility text not null default 'patient' check (visibility in ('patient', 'nutritionist_only')),
  created_at timestamptz not null default now()
);

-- Labs
create table if not exists public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  storage_path text not null,
  extracted_text text,
  interpretation_summary text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  ai_interpretation text,
  uploaded_by text check (uploaded_by in ('patient', 'nutritionist')),
  published_by text check (published_by in ('patient', 'nutritionist')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.lab_reports (id) on delete cascade,
  marker_key text not null,
  marker_name text not null,
  value numeric,
  value_text text,
  unit text,
  ref_min numeric,
  ref_max numeric,
  flag text check (flag in ('low', 'normal', 'high', 'unknown'))
);

create table if not exists public.lab_reference_ranges (
  marker_key text primary key,
  name text not null,
  unit text not null,
  ref_min numeric,
  ref_max numeric,
  interpretation_notes text
);

-- Insights
create table if not exists public.patient_insights (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  type text not null check (type in ('manual', 'computed')),
  title text not null,
  body text not null,
  visible_to_patient boolean not null default true,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.diet_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  checked_at date not null default current_date,
  adhered boolean not null default true,
  unique (patient_id, checked_at)
);

-- Foods
create table if not exists public.foods_taco (
  id serial primary key,
  name text not null,
  per_100g jsonb not null
);

create table if not exists public.foods_tbca (
  id serial primary key,
  code text,
  name text not null,
  food_group text,
  per_100g jsonb not null
);

create index if not exists foods_tbca_name_idx on public.foods_tbca (name);

create table if not exists public.food_search_cache (
  query_hash text primary key,
  results jsonb not null,
  expires_at timestamptz not null
);

-- Security / privacy
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  consent_type text not null,
  version text not null,
  accepted_at timestamptz not null default now()
);

-- Helper functions for RLS
create or replace function public.is_nutritionist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nutritionist'
  );
$$;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.patients where user_id = auth.uid() limit 1;
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.payment_settings enable row level security;
alter table public.payment_methods enable row level security;
alter table public.google_calendar_connections enable row level security;
alter table public.diet_plans enable row level security;
alter table public.diet_meals enable row level security;
alter table public.diet_items enable row level security;
alter table public.diet_supplements enable row level security;
alter table public.diet_referrals enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.lab_reports enable row level security;
alter table public.lab_results enable row level security;
alter table public.lab_reference_ranges enable row level security;
alter table public.patient_insights enable row level security;
alter table public.diet_checkins enable row level security;
alter table public.foods_taco enable row level security;
alter table public.foods_tbca enable row level security;
alter table public.food_search_cache enable row level security;
alter table public.audit_logs enable row level security;
alter table public.consent_records enable row level security;

-- Profiles policies
create policy "profiles_select_own_or_nutritionist"
on public.profiles for select
using (id = auth.uid() or public.is_nutritionist());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid());

-- Patients policies
create policy "patients_select_own_or_nutritionist"
on public.patients for select
using (user_id = auth.uid() or public.is_nutritionist());

create policy "patients_update_nutritionist"
on public.patients for update
using (public.is_nutritionist());

create policy "patients_insert_nutritionist"
on public.patients for insert
with check (public.is_nutritionist());

-- Availability (patients read, nutritionist write)
create policy "availability_rules_select_authenticated"
on public.availability_rules for select to authenticated
using (true);

create policy "availability_rules_write_nutritionist"
on public.availability_rules for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "availability_blocks_select_authenticated"
on public.availability_blocks for select to authenticated
using (true);

create policy "availability_blocks_write_nutritionist"
on public.availability_blocks for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

-- Appointments
create policy "appointments_select_own_or_nutritionist"
on public.appointments for select
using (
  patient_id = public.current_patient_id() or public.is_nutritionist()
);

create policy "appointments_insert_patient"
on public.appointments for insert
with check (patient_id = public.current_patient_id());

create policy "appointments_update_nutritionist"
on public.appointments for update
using (public.is_nutritionist());

-- Payment (patients read active methods + settings, nutritionist write)
create policy "payment_settings_select_authenticated"
on public.payment_settings for select to authenticated
using (true);

create policy "payment_settings_write_nutritionist"
on public.payment_settings for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "payment_methods_select_authenticated"
on public.payment_methods for select to authenticated
using (active = true or public.is_nutritionist());

create policy "payment_methods_write_nutritionist"
on public.payment_methods for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

-- Google calendar (nutritionist only)
create policy "google_calendar_nutritionist"
on public.google_calendar_connections for all
using (nutritionist_id = auth.uid())
with check (nutritionist_id = auth.uid());

-- Generic patient-owned tables
create policy "diet_plans_patient_read"
on public.diet_plans for select
using (patient_id = public.current_patient_id() or public.is_nutritionist());

create policy "diet_plans_nutritionist_write"
on public.diet_plans for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "diet_meals_via_plan"
on public.diet_meals for select
using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = diet_plan_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

create policy "diet_meals_nutritionist_write"
on public.diet_meals for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "diet_items_via_meal"
on public.diet_items for select
using (
  exists (
    select 1 from public.diet_meals dm
    join public.diet_plans dp on dp.id = dm.diet_plan_id
    where dm.id = meal_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

create policy "diet_items_nutritionist_write"
on public.diet_items for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "diet_supplements_via_plan"
on public.diet_supplements for select
using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = diet_plan_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

create policy "diet_supplements_nutritionist_write"
on public.diet_supplements for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "diet_referrals_via_plan"
on public.diet_referrals for select
using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = diet_plan_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

create policy "diet_referrals_nutritionist_write"
on public.diet_referrals for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "body_measurements_patient"
on public.body_measurements for select
using (patient_id = public.current_patient_id() or public.is_nutritionist());

create policy "body_measurements_write"
on public.body_measurements for all
using (patient_id = public.current_patient_id() or public.is_nutritionist())
with check (patient_id = public.current_patient_id() or public.is_nutritionist());

create policy "progress_photos_patient"
on public.progress_photos for select
using (
  (patient_id = public.current_patient_id() and visibility = 'patient')
  or public.is_nutritionist()
);

create policy "progress_photos_write"
on public.progress_photos for all
using (patient_id = public.current_patient_id() or public.is_nutritionist())
with check (patient_id = public.current_patient_id() or public.is_nutritionist());

create policy "lab_reports_patient_published"
on public.lab_reports for select
using (
  (patient_id = public.current_patient_id() and status = 'published')
  or public.is_nutritionist()
);

create policy "lab_reports_nutritionist_write"
on public.lab_reports for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "lab_results_via_report"
on public.lab_results for select
using (
  exists (
    select 1 from public.lab_reports lr
    where lr.id = report_id
      and (
        (lr.patient_id = public.current_patient_id() and lr.status = 'published')
        or public.is_nutritionist()
      )
  )
);

create policy "lab_results_nutritionist_write"
on public.lab_results for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "lab_reference_ranges_read"
on public.lab_reference_ranges for select to authenticated
using (true);

create policy "lab_reference_ranges_write_nutritionist"
on public.lab_reference_ranges for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "patient_insights_read"
on public.patient_insights for select
using (
  public.is_nutritionist()
  or (patient_id = public.current_patient_id() and visible_to_patient = true)
);

create policy "patient_insights_write_nutritionist"
on public.patient_insights for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "diet_checkins_own"
on public.diet_checkins for all
using (patient_id = public.current_patient_id() or public.is_nutritionist())
with check (patient_id = public.current_patient_id() or public.is_nutritionist());

create policy "foods_taco_read"
on public.foods_taco for select to authenticated
using (true);

create policy "foods_tbca_read"
on public.foods_tbca for select to authenticated
using (true);

create policy "food_search_cache_service"
on public.food_search_cache for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create policy "audit_logs_nutritionist"
on public.audit_logs for select
using (public.is_nutritionist());

create policy "consent_records_own"
on public.consent_records for select
using (patient_id = public.current_patient_id() or public.is_nutritionist());

-- Trigger: auto-create profile on signup (service role handles patient link)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Default payment settings row
insert into public.payment_settings (consultation_price_cents, instructions, cancellation_policy)
select 0, 'Entre em contato para instruções de pagamento.', 'Cancelamentos com 24h de antecedência.'
where not exists (select 1 from public.payment_settings limit 1);
