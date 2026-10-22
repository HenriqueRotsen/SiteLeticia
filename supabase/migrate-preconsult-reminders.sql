-- Controle dos lembretes da ficha pré-consulta (1 dia e 1 hora antes da consulta).
alter table public.appointments
  add column if not exists preconsult_day_reminder_at timestamptz,
  add column if not exists preconsult_hour_reminder_at timestamptz;
