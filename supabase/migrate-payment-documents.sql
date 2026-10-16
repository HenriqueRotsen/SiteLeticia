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
