-- Padronizar conta da nutricionista (e-mail canônico).
-- Preferência: criar/usar o usuário Auth com este e-mail e promover o role.

update public.profiles
set
  role = 'nutritionist',
  full_name = 'Letícia Cunha',
  email = 'leticiavrcunha@gmail.com'
where email in (
  'leticiavrcunha@gmail.com',
  'leticiacunhacontato@gmail.com'
)
   or id = (
     select id from auth.users where email = 'leticiavrcunha@gmail.com' limit 1
   );
