-- Suplementação e encaminhamentos ligados ao plano alimentar
create table if not exists public.diet_supplements (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans (id) on delete cascade,
  sort_order smallint not null default 0,
  product_name text not null,
  dosage text not null,
  posology text not null,
  notes text
);

create table if not exists public.diet_referrals (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans (id) on delete cascade,
  sort_order smallint not null default 0,
  specialty text not null,
  professional_name text,
  reason text not null,
  urgency text not null default 'routine' check (urgency in ('routine', 'priority')),
  notes text
);

create index if not exists diet_supplements_plan_idx on public.diet_supplements (diet_plan_id);
create index if not exists diet_referrals_plan_idx on public.diet_referrals (diet_plan_id);

alter table public.diet_supplements enable row level security;
alter table public.diet_referrals enable row level security;

drop policy if exists "diet_supplements_via_plan" on public.diet_supplements;
create policy "diet_supplements_via_plan"
on public.diet_supplements for select
using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = diet_plan_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

drop policy if exists "diet_supplements_nutritionist_write" on public.diet_supplements;
create policy "diet_supplements_nutritionist_write"
on public.diet_supplements for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

drop policy if exists "diet_referrals_via_plan" on public.diet_referrals;
create policy "diet_referrals_via_plan"
on public.diet_referrals for select
using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = diet_plan_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

drop policy if exists "diet_referrals_nutritionist_write" on public.diet_referrals;
create policy "diet_referrals_nutritionist_write"
on public.diet_referrals for all
using (public.is_nutritionist())
with check (public.is_nutritionist());
