-- Permite à nutricionista desativar a marcação de novas consultas pelos pacientes.

alter table public.payment_settings
  add column if not exists booking_enabled boolean not null default true;
