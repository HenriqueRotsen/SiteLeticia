-- Dietas via CSV FatSecret (Detailed Report)
alter table public.diet_plans
  add column if not exists source text default 'manual',
  add column if not exists source_pdf_path text,
  add column if not exists extraction_summary text,
  add column if not exists extraction_method text;

alter table public.diet_items drop constraint if exists diet_items_source_check;
alter table public.diet_items
  add constraint diet_items_source_check
  check (source in ('taco', 'tbca', 'usda', 'off', 'fatsecret', 'fatsecret_csv', 'fatsecret_pdf', 'custom'));

alter table public.diet_plans drop constraint if exists diet_plans_source_check;
alter table public.diet_plans
  add constraint diet_plans_source_check
  check (source is null or source in ('manual', 'fatsecret_csv', 'fatsecret_pdf'));
