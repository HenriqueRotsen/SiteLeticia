-- Execute este SQL no Supabase SQL Editor depois de publicar a versao com
-- reCAPTCHA. Ele remove o INSERT publico direto na tabela waitlist.
-- A partir disso, novos cadastros entram apenas pela API /api/waitlist/signup,
-- que valida o reCAPTCHA antes de gravar usando a service_role key no servidor.

drop policy if exists "Public can join waitlist" on public.waitlist;
