-- Ficha pré-consulta (preenchida pelo paciente na 1ª marcação; visível à nutricionista)

create table if not exists public.patient_preconsult_forms (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id)
);

create index if not exists patient_preconsult_forms_status_idx
  on public.patient_preconsult_forms (status);

alter table public.patient_preconsult_forms enable row level security;

drop policy if exists "preconsult_patient_own" on public.patient_preconsult_forms;
create policy "preconsult_patient_own"
on public.patient_preconsult_forms for all
using (patient_id = public.current_patient_id())
with check (patient_id = public.current_patient_id());

drop policy if exists "preconsult_nutritionist_select" on public.patient_preconsult_forms;
create policy "preconsult_nutritionist_select"
on public.patient_preconsult_forms for select
using (public.is_nutritionist());

drop policy if exists "preconsult_nutritionist_all" on public.patient_preconsult_forms;
create policy "preconsult_nutritionist_all"
on public.patient_preconsult_forms for all
using (public.is_nutritionist())
with check (public.is_nutritionist());
