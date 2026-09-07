# Threat model (resumo MVP)

## Ativos
- Dados de saúde (dietas, exames, fotos, medições)
- CPF e contatos
- Tokens OAuth Google (refresh token criptografado)

## Superfícies
- `/api/auth/*`, `/api/appointments/*`, uploads PDF/foto
- Portais `/app/*` e `/admin/*`

## Controles
- Supabase RLS por paciente/nutricionista
- Middleware Next.js por role
- Rate limit em auth e busca
- Headers CSP/HSTS
- Audit log sem PII
- Validação Zod em APIs

## Riscos residuais
- OAuth Google em modo testing
- PDF escaneado sem OCR avançado
- Rate limit in-memory (usar Redis/Upstash em produção multi-instância)
