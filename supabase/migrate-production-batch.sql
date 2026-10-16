-- Agrupa suplementos em "combos"/pedidos (group_id + group_title).
-- Itens avulsos ficam com group_id nulo.

alter table public.diet_supplements
  add column if not exists group_id uuid,
  add column if not exists group_title text;

create index if not exists diet_supplements_group_idx
  on public.diet_supplements (diet_plan_id, group_id, sort_order);
-- Presets editáveis (pacotes) + pedidos de exame no plano + corpo do encaminhamento

alter table public.diet_referrals
  add column if not exists body_text text;

create table if not exists public.diet_exam_orders (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans (id) on delete cascade,
  sort_order smallint not null default 0,
  title text not null default 'Pedido de exames',
  exams jsonb not null default '[]'::jsonb,
  collection_notes jsonb not null default '[]'::jsonb,
  observations text,
  meta jsonb not null default '{}'::jsonb
);

alter table public.diet_exam_orders
  add column if not exists meta jsonb not null default '{}'::jsonb;

create index if not exists diet_exam_orders_plan_idx on public.diet_exam_orders (diet_plan_id);

alter table public.diet_exam_orders enable row level security;

drop policy if exists "diet_exam_orders_via_plan" on public.diet_exam_orders;
create policy "diet_exam_orders_via_plan"
on public.diet_exam_orders for select
using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = diet_plan_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

drop policy if exists "diet_exam_orders_nutritionist_write" on public.diet_exam_orders;
create policy "diet_exam_orders_nutritionist_write"
on public.diet_exam_orders for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create table if not exists public.prescription_presets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('supplement_pack', 'exam_order', 'referral_letter')),
  title text not null,
  slug text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, slug)
);

create index if not exists prescription_presets_type_idx
  on public.prescription_presets (type, active, sort_order);

alter table public.prescription_presets enable row level security;

drop policy if exists "prescription_presets_select_nutritionist" on public.prescription_presets;
create policy "prescription_presets_select_nutritionist"
on public.prescription_presets for select
using (public.is_nutritionist());

drop policy if exists "prescription_presets_write_nutritionist" on public.prescription_presets;
create policy "prescription_presets_write_nutritionist"
on public.prescription_presets for all
using (public.is_nutritionist())
with check (public.is_nutritionist());
-- Comprovantes de pagamento e notas fiscais por consulta

alter table public.appointments
  add column if not exists payment_validated_at timestamptz,
  add column if not exists payment_validated_by uuid references public.profiles (id) on delete set null;

create table if not exists public.appointment_documents (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doc_type text not null check (doc_type in ('payment_proof', 'invoice')),
  storage_path text not null,
  mime_type text not null,
  file_name text,
  uploaded_by_role text not null check (uploaded_by_role in ('patient', 'nutritionist')),
  extracted_amount_cents integer,
  extracted_paid_at timestamptz,
  extracted_payer_name text,
  extraction_json jsonb not null default '{}'::jsonb,
  extraction_status text not null default 'pending' check (
    extraction_status in ('pending', 'ok', 'failed')
  ),
  amount_matches boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointment_documents_appointment_idx
  on public.appointment_documents (appointment_id);

create index if not exists appointment_documents_patient_idx
  on public.appointment_documents (patient_id);

create index if not exists appointment_documents_type_idx
  on public.appointment_documents (doc_type);

alter table public.appointment_documents enable row level security;

drop policy if exists "appointment_documents_select_own_or_nutritionist" on public.appointment_documents;
create policy "appointment_documents_select_own_or_nutritionist"
on public.appointment_documents for select
using (
  patient_id = public.current_patient_id()
  or public.is_nutritionist()
);

drop policy if exists "appointment_documents_patient_insert_proof" on public.appointment_documents;
create policy "appointment_documents_patient_insert_proof"
on public.appointment_documents for insert
with check (
  patient_id = public.current_patient_id()
  and uploaded_by_role = 'patient'
  and doc_type = 'payment_proof'
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_id
      and a.patient_id = public.current_patient_id()
  )
);

drop policy if exists "appointment_documents_nutritionist_write" on public.appointment_documents;
create policy "appointment_documents_nutritionist_write"
on public.appointment_documents for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

-- Pacientes só leem planos ativos (liberação fina continua na API via pagamento validado)
drop policy if exists "diet_plans_patient_read" on public.diet_plans;
create policy "diet_plans_patient_read"
on public.diet_plans for select
using (
  public.is_nutritionist()
  or (
    patient_id = public.current_patient_id()
    and status = 'active'
  )
);
-- Prontuário clínico por sessão (texto puro)

create table if not exists public.clinical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  session_at timestamptz not null default now(),
  title text,
  body_text text not null default '',
  notes text,
  storage_path text,
  mime_type text,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migração a partir de versões anteriores (arquivo / markdown)
alter table public.clinical_records add column if not exists body_md text;
alter table public.clinical_records add column if not exists body_text text;

update public.clinical_records
set body_text = coalesce(nullif(body_text, ''), nullif(body_md, ''), coalesce(notes, ''), '')
where body_text is null or body_text = '';

alter table public.clinical_records alter column body_text set default '';
alter table public.clinical_records alter column body_text set not null;

alter table public.clinical_records alter column storage_path drop not null;
alter table public.clinical_records alter column mime_type drop not null;

create index if not exists clinical_records_patient_session_idx
  on public.clinical_records (patient_id, session_at desc);

create index if not exists clinical_records_appointment_idx
  on public.clinical_records (appointment_id)
  where appointment_id is not null;

alter table public.clinical_records enable row level security;

drop policy if exists "clinical_records_nutritionist_all" on public.clinical_records;
create policy "clinical_records_nutritionist_all"
on public.clinical_records for all
using (public.is_nutritionist())
with check (public.is_nutritionist());
-- Códigos de verificação por e-mail (2FA no login)

create table if not exists public.auth_email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  purpose text not null check (purpose in ('login_mfa', 'password_reset')),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_email_otps_user_purpose_idx
  on public.auth_email_otps (user_id, purpose, created_at desc);

alter table public.auth_email_otps enable row level security;

-- Apenas service role acessa (sem policies para authenticated)

-- Permite à nutricionista desativar a marcação de novas consultas pelos pacientes.

alter table public.payment_settings
  add column if not exists booking_enabled boolean not null default true;

