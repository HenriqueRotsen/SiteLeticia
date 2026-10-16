-- Códigos de verificação por e-mail (2FA no login)

create table if not exists public.auth_email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  purpose text not null check (purpose in ('login_mfa', 'password_reset')),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_email_otps_user_purpose_idx
  on public.auth_email_otps (user_id, purpose, created_at desc);

alter table public.auth_email_otps enable row level security;

-- Apenas service role acessa (sem policies para authenticated)
