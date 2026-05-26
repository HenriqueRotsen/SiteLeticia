-- Execute este SQL uma vez no Supabase SQL Editor caso a tabela waitlist
-- ja tenha sido criada com a lista antiga de objetivos.

update public.waitlist
set goal = case goal
  when 'Emagrecimento Saudável' then 'Emagrecimento'
  when 'Hipertrofia/Massa Muscular' then 'Hipertrofia'
  when 'Saúde e Disposição' then 'Nutrição clínica'
  when 'Nutrição Clínica' then 'Nutrição clínica'
  else goal
end;

alter table public.waitlist
drop constraint if exists waitlist_goal_check;

alter table public.waitlist
add constraint waitlist_goal_check check (
  goal in (
    'Emagrecimento',
    'Saúde intestinal',
    'Medicina de precisão',
    'Nutrição clínica',
    'Hipertrofia'
  )
);
