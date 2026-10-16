-- Migração: fila de espera → pacientes (preserva os 62+ registros originais)
-- Execute UMA VEZ no SQL Editor do Supabase, DEPOIS de schema.sql e platform-schema.sql.
--
-- O que este script faz:
-- 1. NÃO apaga nem altera dados da tabela waitlist (backup permanente).
-- 2. Permite pacientes sem CPF (leads da fila) até criarem conta.
-- 3. Copia cada entrada da waitlist para patients (idempotente — pode rodar de novo).
-- 4. Vincula waitlist.converted_patient_id ao paciente importado.
--
-- Verificação após executar:
--   select count(*) from public.waitlist;                      -- deve continuar 62+
--   select count(*) from public.patients where source = 'waitlist';

-- Leads podem existir sem CPF até o cadastro na plataforma
alter table public.patients alter column cpf drop not null;
alter table public.patients alter column cpf_hash drop not null;

alter table public.patients
  add column if not exists waitlist_id bigint references public.waitlist (id) on delete set null,
  add column if not exists source text not null default 'signup';

alter table public.patients drop constraint if exists patients_source_check;
alter table public.patients add constraint patients_source_check
  check (source in ('signup', 'waitlist', 'admin'));

alter table public.patients drop constraint if exists patients_cpf_required_with_account;
alter table public.patients add constraint patients_cpf_required_with_account
  check (user_id is null or cpf is not null);

-- CPF único apenas quando informado
alter table public.patients drop constraint if exists patients_cpf_key;
drop index if exists public.patients_cpf_unique;
create unique index if not exists patients_cpf_unique on public.patients (cpf) where cpf is not null;

-- Um telefone = um prontuário (WhatsApp da fila)
drop index if exists public.patients_phone_unique;
create unique index if not exists patients_phone_unique on public.patients (phone);

-- Referência reversa (waitlist continua intacta)
alter table public.waitlist
  add column if not exists converted_patient_id uuid references public.patients (id) on delete set null;

-- Importação idempotente: nome + WhatsApp + objetivo
insert into public.patients (full_name, phone, goal, waitlist_id, source, cpf, cpf_hash)
select
  w.full_name,
  w.phone,
  w.goal,
  w.id,
  'waitlist',
  null,
  null
from public.waitlist w
where not exists (
  select 1
  from public.patients p
  where p.waitlist_id = w.id or p.phone = w.phone
);

update public.waitlist w
set converted_patient_id = p.id
from public.patients p
where p.waitlist_id = w.id
  and w.converted_patient_id is distinct from p.id;

-- Conferência
select
  (select count(*) from public.waitlist) as waitlist_total,
  (select count(*) from public.patients where source = 'waitlist') as patients_from_waitlist,
  (select count(*) from public.patients where cpf is null) as patients_without_cpf;
