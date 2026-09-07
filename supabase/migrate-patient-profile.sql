-- Endereço e dados de perfil editáveis pelo paciente
alter table public.patients
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists address_neighborhood text,
  add column if not exists address_city text,
  add column if not exists address_state text check (char_length(address_state) <= 2),
  add column if not exists address_zip text;
