# Bases de alimentos (TACO / TBCA)

Esta pasta guarda os arquivos baixados pelo script de importação. **Não versionamos os CSVs/JSONL** (são grandes).

## Importar tudo no Supabase

Pré-requisitos:

1. Rodar `supabase/migrate-food-sources.sql` no SQL Editor (se ainda não rodou).
2. Ter `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`.

Comandos:

```bash
npm run import:foods:taco
npm run import:foods:tbca
```

Isso baixa as bases, **apaga amostras antigas** (`--clear`) e importa em lote.

## Fontes

| Tabela | Registros | Origem |
|--------|-----------|--------|
| TACO | ~597 | [brolesi/taco](https://github.com/brolesi/taco) (NEPA/UNICAMP 4ª ed.) |
| TBCA | ~500 complementos | Mesma fonte, **filtrada** (sem duplicar a TACO, nomes curtos) |

Por padrão no app, a busca usa **somente TACO** (como a tabela oficial de ingredientes). A TBCA é opcional.

Import TBCA (complemento, padrão):

```bash
npm run import:foods:tbca
```

Import TBCA sem deduplicar TACO:

```bash
node scripts/import-foods.mjs --table=tbca --download --push --clear --all
```

Para usar arquivos locais (ex.: exportação manual):

```bash
node scripts/import-foods.mjs --table=taco --file=./data/meu-taco.csv --push --clear
node scripts/import-foods.mjs --table=tbca --file=./data/meu-tbca.jsonl --push --clear
```
