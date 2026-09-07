-- TBCA + novas fontes em diet_items (tbca, usda)

create table if not exists public.foods_tbca (
  id serial primary key,
  code text,
  name text not null,
  food_group text,
  per_100g jsonb not null
);

create index if not exists foods_tbca_name_idx on public.foods_tbca (name);
create index if not exists foods_tbca_code_idx on public.foods_tbca (code) where code is not null;

alter table public.foods_tbca enable row level security;

drop policy if exists "foods_tbca_read" on public.foods_tbca;
create policy "foods_tbca_read"
on public.foods_tbca for select to authenticated
using (true);

alter table public.diet_items drop constraint if exists diet_items_source_check;
alter table public.diet_items add constraint diet_items_source_check
  check (source in ('taco', 'tbca', 'usda', 'off', 'fatsecret', 'custom'));
