-- Agrupa suplementos em "combos"/pedidos (group_id + group_title).
-- Itens avulsos ficam com group_id nulo.

alter table public.diet_supplements
  add column if not exists group_id uuid,
  add column if not exists group_title text;

create index if not exists diet_supplements_group_idx
  on public.diet_supplements (diet_plan_id, group_id, sort_order);
