-- Fila de espera: data em que a Letícia avisou a pessoa de que já pode marcar consulta.
-- Rode uma vez no SQL Editor do Supabase. Pode rodar de novo sem problema.

alter table public.waitlist
  add column if not exists called_at timestamptz;

-- Quem já estava como "chamado" antes desta mudança fica sem data (aparece "—").

create index if not exists waitlist_status_called_at_idx
  on public.waitlist (status, called_at);
