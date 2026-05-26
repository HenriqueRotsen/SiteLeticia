-- Execute este SQL no Supabase SQL Editor para adicionar o objetivo
-- "Cirurgia Bariátrica" em uma tabela waitlist ja existente.

alter table public.waitlist
drop constraint if exists waitlist_goal_check;

alter table public.waitlist
add constraint waitlist_goal_check check (
  goal in (
    'Emagrecimento',
    'Cirurgia Bariátrica',
    'Saúde intestinal',
    'Medicina de precisão',
    'Nutrição clínica',
    'Hipertrofia'
  )
);
