-- Ata do Google Meet como rascunho de prontuário (experimental).
-- Rode no SQL Editor do Supabase antes de ligar GOOGLE_MEET_NOTES_ENABLED=true.

-- Prontuário: rascunho x confirmado, e de onde veio o texto.
alter table public.clinical_records
  add column if not exists status text not null default 'final';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clinical_records_status_check'
  ) then
    alter table public.clinical_records
      add constraint clinical_records_status_check check (status in ('draft', 'final'));
  end if;
end $$;

alter table public.clinical_records add column if not exists source text;
alter table public.clinical_records add column if not exists source_ref text;

-- Uma importação automática por consulta (evita duplicar se a rotina rodar de novo).
create unique index if not exists clinical_records_appointment_source_uidx
  on public.clinical_records (appointment_id, source)
  where appointment_id is not null and source is not null;

-- Consulta: quando a ata foi importada (ou a rotina desistiu de procurar).
alter table public.appointments add column if not exists meet_notes_imported_at timestamptz;
