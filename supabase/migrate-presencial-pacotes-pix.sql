-- Consulta presencial, pacotes de consultas e PIX copia e cola.
-- Pode rodar mais de uma vez sem problema.

-- ===== Consulta presencial =====

alter table public.appointments
  add column if not exists modality text not null default 'online';

alter table public.appointments
  drop constraint if exists appointments_modality_check;

alter table public.appointments
  add constraint appointments_modality_check check (modality in ('online', 'in_person'));

-- Endereço em texto (cópia do endereço configurado no momento da marcação).
alter table public.appointments
  add column if not exists location text;

-- { placeName, cep, street, number, complement, district, city, state }
alter table public.payment_settings
  add column if not exists clinic_address jsonb;

-- ===== Pacotes de consultas =====

create table if not exists public.consultation_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sessions smallint not null check (sessions between 2 and 50),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pacote contratado por um paciente. Guarda uma cópia do nome/preço no momento da compra.
create table if not exists public.patient_packages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  package_id uuid references public.consultation_packages (id) on delete set null,
  name text not null,
  sessions_total smallint not null check (sessions_total > 0),
  sessions_used smallint not null default 0 check (sessions_used >= 0),
  price_cents integer not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patient_packages_patient_id_idx on public.patient_packages (patient_id);

alter table public.appointments
  add column if not exists patient_package_id uuid references public.patient_packages (id) on delete set null;

-- Acesso só pelo servidor (service role); o app nunca lê essas tabelas direto do navegador.
alter table public.consultation_packages enable row level security;
alter table public.patient_packages enable row level security;

-- ===== PIX copia e cola por produto =====
-- A Letícia cola o código gerado no banco (com o valor) e o paciente vê o QR code.
alter table public.payment_settings
  add column if not exists consultation_pix_code text;

alter table public.payment_settings
  add column if not exists return_pix_code text;

alter table public.consultation_packages
  add column if not exists pix_code text;

-- Cópia do código no momento da compra (se a Letícia trocar o código depois, quem já comprou mantém o seu).
alter table public.patient_packages
  add column if not exists pix_code text;
