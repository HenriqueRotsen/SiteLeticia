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
