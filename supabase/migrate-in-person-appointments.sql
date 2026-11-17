-- Consulta presencial: modalidade da consulta, local salvo na própria consulta
-- e endereço de atendimento configurado pela nutricionista.

alter table public.appointments
  add column if not exists modality text not null default 'online';

alter table public.appointments
  drop constraint if exists appointments_modality_check;

alter table public.appointments
  add constraint appointments_modality_check check (modality in ('online', 'in_person'));

-- Endereço em texto (cópia do endereço configurado no momento da marcação).
alter table public.appointments
  add column if not exists location text;

-- { placeName, cep, street, number, complement, district, city, state }
alter table public.payment_settings
  add column if not exists clinic_address jsonb;
