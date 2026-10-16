-- Metadados de validação do laudo (timing declarado, checagem de paciente/data).

alter table public.lab_reports
  add column if not exists meta jsonb not null default '{}'::jsonb;
