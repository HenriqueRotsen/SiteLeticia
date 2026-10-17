# Segurança

## Relatar vulnerabilidades

Envie um e-mail para o mantenedor do projeto (ou abra um security advisory privado no GitHub).
Não abra issues públicas com detalhes exploráveis.

## Controles automatizados

O repositório roda na CI:

| Ferramenta | O que cobre |
| --- | --- |
| ESLint (`next lint`) | Qualidade / padrões Next.js |
| Vitest | Testes unitários |
| `npm audit` | CVEs em dependências npm (nível high+) |
| CodeQL | Análise estática (security-extended + quality) |
| Semgrep | SAST (JS/TS, React, Next.js, OWASP, secrets) |
| Gitleaks | Vazamento de segredos no código |
| OSV-Scanner | Vulnerabilidades conhecidas no lockfile |
| Dependabot | PRs semanais de deps e Actions |

## Segredos

Nunca committe `.env`, service role keys, tokens Resend/Gemini/OpenAI ou chaves privadas.
Use variáveis de ambiente na Vercel / GitHub Secrets.
