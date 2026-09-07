-- Dados antropométricos do paciente para cálculo de TMB/GET
alter table public.patients
  add column if not exists sex text check (sex in ('male', 'female')),
  add column if not exists birth_date date,
  add column if not exists height_cm numeric check (height_cm > 0 and height_cm < 300),
  add column if not exists body_fat_percent numeric check (body_fat_percent >= 3 and body_fat_percent <= 70),
  add column if not exists activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'heavy', 'very_heavy')
  );
