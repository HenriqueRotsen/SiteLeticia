# Plano: migração Next 14.2.35 → Next 15.5.24+

Objetivo: fechar os alertas do Dependabot do Next (2 críticos, vários altos) que só têm correção a partir de 15.5.24. A linha 14 já está no último patch (14.2.35), então não há correção dentro dela.

Este documento é só o plano. Nenhuma mudança de código foi feita.

## 1. Escopo e versões alvo

- `next`: `^14.2.15` → `15.5.24` (ou a última 15.5.x disponível na hora da execução).
- `react` e `react-dom`: `^18.3.1` → `^19`. O App Router do Next 15 exige React 19.
- `eslint-config-next`: `^14.2.15` → `15.5.24`, na mesma versão do Next.
- Fora deste escopo: Next 16 (o `middleware.js` vira `proxy.js` e há outras mudanças). Fica para depois.

Compatibilidade confirmada pelos peer ranges instalados: `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`, `recharts`, `lucide-react` e `@testing-library/react` aceitam React 19.

## 2. Mudanças de código necessárias

### 2.1 `params` vira Promise em Route Handlers (principal)

No Next 15, `params` nos Route Handlers é uma Promise. Hoje o código lê `params.id` de forma síncrona.

- 20 arquivos `route.js` recebem `{ params }` no contexto. Exemplos:
  - `src/app/api/appointments/[id]/route.js`
  - `src/app/api/patients/[id]/labs/route.js`
  - `src/app/api/patients/[id]/prontuario/[recordId]/route.js`
  - `src/app/api/admin/patients/[id]/route.js`
- Mudança: `const { id } = await params;` (ou `const p = await params;`). Acesso como `params?.id` precisa virar `(await params)?.id`.
- Essa mudança é compatível com o Next 14 (`await` em um objeto simples funciona). Por isso pode ir primeiro, num commit separado, e validar com a versão atual.

### 2.2 `next.config.js`

- `experimental.serverComponentsExternalPackages` vira `serverExternalPackages` (no nível raiz, sem `experimental`). Lista atual: `pdf-parse` e `sharp`.
  - **Correção durante a execução do commit 1:** o Next 14.2.35 não reconhece a chave raiz `serverExternalPackages`. Ela só existe como `experimental.serverComponentsExternalPackages`. Por isso a troca fica para o commit 2, junto com a subida para o Next 15.
- `images.formats`, `headers()` e o CSP não mudam.

### 2.3 APIs que já são assíncronas

- `cookies()` já é usado com `await` em `src/lib/supabase/server.js` e em `src/app/api/auth/session/route.js`. Nada a mudar.
- `headers()` e `draftMode()` não aparecem em outros lugares.

### 2.4 Caching

- No Next 15, `fetch` não é mais cacheado por padrão, e os `GET` de Route Handlers passam a ser dinâmicos por padrão.
- Os `fetch` com `next: { revalidate }` em `src/lib/foods/usda.js` e `src/lib/foods/search.js` mantêm o comportamento, pois o cache é explícito.
- Revisar os `GET` de Route Handlers que hoje podem ser estáticos (por exemplo, consultas de alimentos que não dependem de usuário). Se o comportamento atual depende de cache, adicionar `export const dynamic = "force-static"` ou o cache explícito. Se não, nada muda.

### 2.5 Pontos verificados sem mudança esperada

- `src/middleware.js` segue funcionando no Next 15 (com matcher em `/app`, `/admin` e `/api`).
- Páginas (`page.js`, `layout.js`) e `params` em componentes cliente usam `useParams` e `useSearchParams`, que não mudam. Os `page.js` de servidor não recebem `params` nem `searchParams` como props.
- `next/font/local` e `next/font/google` em `src/app/layout.js`: sem mudança esperada.
- `react-dom` (`createPortal` em `src/components/ui/Modal.js`): sem mudança.

## 3. Ordem de execução sugerida

Trabalhar num branch novo (por exemplo `migracao-next-15`) a partir de `atualizacao-v2` ou `main`, conforme o que já estiver mergeado.

1. **Commit 1 (ainda no Next 14):** trocar `params` por `await params` nos 20 arquivos de Route Handlers (31 handlers). Rodar testes e build. Isso valida a parte mais numerosa sem mexer na versão. A renomeação de `serverComponentsExternalPackages` NÃO entra aqui (ver 2.2).
2. **Commit 2:** subir `next`, `eslint-config-next`, `react`, `react-dom` (e `@types/react` se existir) e renomear `serverComponentsExternalPackages` para `serverExternalPackages`. Rodar `npm install`, depois `lint`, `test:run` e `build`.
3. **Commit 3 (se necessário):** ajustes de caching e `dynamic` nos GET de Route Handlers, após revisão.

Cada commit precisa passar em lint, testes e build antes do próximo.

## 4. Verificação

Automática:
- `npm run lint`
- `npm run test:run` (22 arquivos, 80 testes hoje)
- `npm run build`
- `npm run test:e2e` (Playwright, `e2e/smoke.spec.js`)
- `npm run security:audit`, que deve passar com a allowlist atual. Depois da migração, a allowlist de `next`, `postcss`, `eslint-config-next` e `@next/eslint-plugin-next` pode ser reduzida em `.github/audit-allowlist.json` e `osv-scanner.toml`.
- Dependabot: os alertas de `next` e `postcss` devem fechar no merge.

Manual (ambiente de preview da Vercel):
- Login, verificação de código, cadastro e recuperação de senha (cookies do Supabase).
- Rotas com `[id]`: agenda, ficha, prontuário, exames, dieta e pré-consulta, tanto no paciente quanto no admin.
- Rotas de API com `params`: testar com um id real pela aplicação.
- Callback do Google Calendar (`src/app/api/auth/google/calendar/callback/route.js`) e `auth/callback`.
- Cron de lembretes de pré-consulta (`src/app/api/cron/preconsult-reminders/route.js`).
- Busca de alimentos (USDA, FatSecret, OpenFoodFacts) com cache.

## 5. Riscos

- **Médio:** o volume de `params` nos Route Handlers é grande, e um `params` esquecido não gera erro de build, só falha em runtime. Mitigação: grep de `params\.` em `route.js` depois do commit 1 (hoje há cerca de 63 ocorrências).
- **Médio:** React 19 pode afetar bibliotecas não listadas aqui. Mitigação: verificar `npm ls react` e rodar o smoke test.
- **Baixo:** mudanças de caching nos GET. Mitigação: revisão dos GET listados no item 2.4.

## 6. Reversão

- Trabalhar num branch separado. Se algo falhar em produção, reverter o merge.
- Os commits 1 e 2 são independentes: o commit 1 pode ficar mesmo se o 2 for revertido.

## 7. Estimativa

Cerca de 1 a 2 dias de trabalho, sem contar a validação manual no preview.
