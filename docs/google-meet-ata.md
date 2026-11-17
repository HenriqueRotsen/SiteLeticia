# Ata do Google Meet como rascunho de prontuário (experimental)

Pesquisa feita em 17/11/2026 na documentação oficial do Google. O código está pronto, mas
**desligado** (`GOOGLE_MEET_NOTES_ENABLED=false`). Antes de ligar, confira os pré-requisitos.

## Caminhos que o Google oferece

| Caminho | O que lê | Escopo | Classificação | Conta necessária |
|---|---|---|---|---|
| **Anexo do evento no Calendar + Docs API** (escolhido) | Doc "Anotações do Gemini" que o Meet anexa ao evento | `calendar.events` (já temos) + `documents.readonly` | sensível | Quem tiver "Tomar notas para mim" |
| Meet REST API `conferenceRecords.smartNotes` + Docs API | Mesmo Doc, achado pelo registro da conferência | `meetings.space.readonly` + `documents.readonly` | sensível | Idem |
| Meet REST API `conferenceRecords.transcripts.entries` | Texto da transcrição, falante por falante | `meetings.space.readonly` | sensível | Workspace Business Standard ou superior, ou Workspace Individual |
| Drive API (baixar arquivo) | Gravação / transcrição / notas | `drive.readonly` ou `drive.meet.readonly` | **restrito** (exige avaliação de segurança paga) | — |

Pontos das páginas do Google:

- O Meet salva gravações, transcrições e notas no Drive do **organizador** e anexa a ata ao
  evento do Google Agenda.
- "Tomar notas para mim" exige uma edição elegível do Workspace **ou um plano Google AI**
  (desde junho de 2026, contas pessoais com Google AI Pro/Ultra; o Meet gratuito não tem).
  Português é suportado, com um idioma por reunião.
- Transcrição do Meet: só edições Workspace (Business Standard/Plus, Enterprise,
  Education Plus, Workspace Individual…). Conta Gmail pessoal não tem.
- As entradas de transcrição pela API somem 30 dias após a reunião.
- `drive.file` (não sensível) **não** serve: só abre arquivos criados pelo app ou escolhidos
  no seletor.

Por que o caminho escolhido: o sistema já cria o evento com Meet na agenda da Letícia
(`google_event_id` fica salvo na consulta), então os anexos já estão ao alcance com o escopo
atual. Falta só ler o conteúdo do Doc, e `documents.readonly` é sensível (não restrito), sem
avaliação de segurança.

## A conta da Letícia

O repositório aponta para conta pessoal (`leticiavrcunha@gmail.com` em
`supabase/setup-nutritionist.sql` e `.env.example`). Com isso:

- **Transcrição: não disponível** (só Workspace).
- **Ata do Gemini: só com Google AI Pro ou Ultra** na conta que organiza a reunião, e a
  Letícia precisa ativar "Tomar notas para mim" em cada consulta (ou deixar automático nas
  configurações do Meet). Sem isso, nada é anexado e a rotina só reporta `pending`.

Se a conta for (ou virar) Google Workspace com Gemini, tudo funciona igual, e dá para
acrescentar a transcrição como plano B (o código já aceita um Doc de transcrição anexado).

## Como funciona

1. `GET /api/cron/meet-notes` (protegida por `CRON_SECRET`) busca consultas com
   `google_event_id`, encerradas entre 15 minutos e 3 dias atrás e ainda sem
   `meet_notes_imported_at`.
2. Para cada uma, lê o evento no Calendar, escolhe o anexo Google Doc da ata
   (`pickNotesAttachment`), lê o Doc pela Docs API e converte para texto
   (`googleDocToPlainText`; a aba de transcrição fica de fora quando há anotações).
3. Grava em `clinical_records` com `status = 'draft'`, `source = 'google_meet_notes'`,
   vinculado à consulta. Um índice único impede duplicar.
4. Na tela do prontuário o registro aparece como "Rascunho para revisar". A Letícia edita
   se quiser e clica **Confirmar prontuário** (PATCH `status: "final"`, com auditoria
   `clinical_record_confirm`).

Arquivos: `src/lib/google/meet-notes.js`, `src/lib/google/import-meet-notes.js`,
`src/app/api/cron/meet-notes/route.js`, `supabase/migrate-meet-notes-drafts.sql`,
`.github/workflows/meet-notes.yml`.

## Para ligar

1. Confirmar que a conta Google da Letícia tem "Tomar notas para mim" (Google AI Pro/Ultra
   ou Workspace com Gemini). Fazer uma reunião de teste e ver se o Doc aparece anexado ao
   evento no Google Agenda.
2. Rodar `supabase/migrate-meet-notes-drafts.sql` no Supabase.
3. No Google Cloud Console (tela de consentimento OAuth), adicionar o escopo
   `https://www.googleapis.com/auth/documents.readonly` e ativar a **Google Docs API** no
   projeto. É escopo sensível: com o app em produção sem verificação, o Google mostra o
   aviso de "app não verificado" (para uma única usuária dá para seguir por "Avançado").
   Em modo de teste, o acesso expira a cada 7 dias.
4. Definir `GOOGLE_MEET_NOTES_ENABLED=true` na Vercel e fazer novo deploy.
5. A Letícia reconecta o Google em **Configurações → Integrações** e aceita o novo acesso.
6. A busca automática roda a cada 30 minutos pelo GitHub Actions
   (`.github/workflows/meet-notes.yml`, com o secret `CRON_SECRET` que o keep-alive já usa).
   No prontuário, o botão **Buscar atas do Meet** faz a mesma busca na hora, com o login da
   nutricionista (rota `POST /api/admin/meet-notes/sync`).

Cuidados: a ata é gerada por IA a partir de dados de saúde. Fica como rascunho, visível só para
a nutricionista (RLS de `clinical_records`), e só vira prontuário depois de revisada. O
paciente deve saber que a consulta terá anotações automáticas (o próprio Meet avisa os
participantes quando o recurso é ligado).

## Fontes

- https://developers.google.com/workspace/meet/api/guides/artifacts
- https://developers.google.com/workspace/meet/api/guides/authenticate-authorize
- https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.smartNotes
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/docs/api/auth
- https://support.google.com/meet/answer/14754931 (Tomar notas para mim)
- https://support.google.com/meet/answer/12849897 (Transcrições)
