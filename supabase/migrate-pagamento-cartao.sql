-- Pagamento: PIX (mais barato) ou cartão de crédito por link, com a taxa repassada.
-- Rode uma vez no SQL Editor do Supabase. Pode rodar de novo sem problema.

-- Taxa do cartão, parcelas e link/preço da consulta avulsa.
alter table public.payment_settings
  add column if not exists card_fee_percent numeric(5,2) not null default 0,
  add column if not exists card_max_installments smallint not null default 1,
  add column if not exists consultation_card_price_cents integer,
  add column if not exists consultation_card_link text;

-- Taxa e parcelas da consulta no cartão (vazio = a taxa/parcelas gerais acima).
alter table public.payment_settings
  add column if not exists consultation_card_fee_percent numeric(5,2),
  add column if not exists consultation_card_installments smallint;

-- Preço, link, taxa e parcelas do cartão em cada pacote
-- (ex.: plano de 3 meses em até 3x, plano de 6 meses em até 6x, cada um com a sua taxa).
alter table public.consultation_packages
  add column if not exists card_price_cents integer,
  add column if not exists card_link text,
  add column if not exists card_fee_percent numeric(5,2),
  add column if not exists card_installments smallint;

-- Forma escolhida na compra do pacote (o valor fica em price_cents).
alter table public.patient_packages
  add column if not exists payment_method text not null default 'pix',
  add column if not exists card_link text;

-- Forma escolhida para pagar a consulta.
alter table public.appointments
  add column if not exists payment_method text not null default 'pix';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'patient_packages_payment_method_check') then
    alter table public.patient_packages
      add constraint patient_packages_payment_method_check check (payment_method in ('pix', 'card'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'appointments_payment_method_check') then
    alter table public.appointments
      add constraint appointments_payment_method_check check (payment_method in ('pix', 'card'));
  end if;
end $$;

-- As formas antigas "PIX" sem chave (apareciam duas vezes) saem de cena:
-- o PIX agora é o copia e cola de cada produto.
update public.payment_methods
  set active = false
  where type = 'pix' and coalesce(details->>'pixKey', '') = '';
