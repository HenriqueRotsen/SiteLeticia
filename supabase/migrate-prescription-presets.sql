-- Presets editáveis (pacotes) + pedidos de exame no plano + corpo do encaminhamento

alter table public.diet_referrals
  add column if not exists body_text text;

create table if not exists public.diet_exam_orders (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references public.diet_plans (id) on delete cascade,
  sort_order smallint not null default 0,
  title text not null default 'Pedido de exames',
  exams jsonb not null default '[]'::jsonb,
  collection_notes jsonb not null default '[]'::jsonb,
  observations text,
  meta jsonb not null default '{}'::jsonb
);

alter table public.diet_exam_orders
  add column if not exists meta jsonb not null default '{}'::jsonb;

create index if not exists diet_exam_orders_plan_idx on public.diet_exam_orders (diet_plan_id);

alter table public.diet_exam_orders enable row level security;

drop policy if exists "diet_exam_orders_via_plan" on public.diet_exam_orders;
create policy "diet_exam_orders_via_plan"
on public.diet_exam_orders for select
using (
  exists (
    select 1 from public.diet_plans dp
    where dp.id = diet_plan_id
      and (dp.patient_id = public.current_patient_id() or public.is_nutritionist())
  )
);

drop policy if exists "diet_exam_orders_nutritionist_write" on public.diet_exam_orders;
create policy "diet_exam_orders_nutritionist_write"
on public.diet_exam_orders for all
using (public.is_nutritionist())
with check (public.is_nutritionist());

create table if not exists public.prescription_presets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('supplement_pack', 'exam_order', 'referral_letter')),
  title text not null,
  slug text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, slug)
);

create index if not exists prescription_presets_type_idx
  on public.prescription_presets (type, active, sort_order);

alter table public.prescription_presets enable row level security;

drop policy if exists "prescription_presets_select_nutritionist" on public.prescription_presets;
create policy "prescription_presets_select_nutritionist"
on public.prescription_presets for select
using (public.is_nutritionist());

drop policy if exists "prescription_presets_write_nutritionist" on public.prescription_presets;
create policy "prescription_presets_write_nutritionist"
on public.prescription_presets for all
using (public.is_nutritionist())
with check (public.is_nutritionist());
