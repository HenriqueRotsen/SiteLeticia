#!/usr/bin/env node
/**
 * Importa TACO ou TBCA para Supabase (ou gera SQL).
 *
 * Fontes (--download baixa automaticamente):
 * - TACO: brolesi/taco (597 alimentos, NEPA/UNICAMP 4ª ed.)
 * - TBCA: raul-rznd/web-scraping-tbca (JSONL, ~5.6k alimentos)
 *
 * Exemplos:
 *   node scripts/import-foods.mjs --table=taco --download --push --clear
 *   node scripts/import-foods.mjs --table=tbca --download --push --clear
 *   node scripts/import-foods.mjs --table=tbca --download --push --clear --all
 *   node scripts/import-foods.mjs --table=taco --file=./data/taco.csv --sql > supabase/import-taco.sql
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  isTbcaComplementFood,
  isTbcaIngredient,
  normalizeFoodLabel,
  normalizeTbcaDisplayName
} from "../src/lib/foods/tbca-filter.js";
import { sanitizePer100g } from "../src/lib/foods/nutrition.js";

const DOWNLOAD_URLS = {
  taco: "https://raw.githubusercontent.com/brolesi/taco/main/data/processed/taco/taco_composicao.csv",
  tbca: "https://raw.githubusercontent.com/raul-rznd/web-scraping-tbca/main/alimentos.txt"
};

const TBCA_COMPONENT_MAP = {
  Proteína: "protein_g",
  "Carboidrato total": "carbs_g",
  "Carboidrato disponível": "carbs_available_g",
  Lipídios: "fat_g",
  "Fibra alimentar": "fiber_g",
  Cálcio: "calcium_mg",
  Ferro: "iron_mg",
  Sódio: "sodium_mg",
  Magnésio: "magnesium_mg",
  Fósforo: "phosphorus_mg",
  Potássio: "potassium_mg",
  Zinco: "zinc_mg",
  Cobre: "copper_mg",
  Selênio: "selenium_mcg",
  "Vitamina A (RAE)": "vitamin_a_mcg",
  "Vitamina A (RE)": "vitamin_a_re_mcg",
  "Vitamina D": "vitamin_d_mcg",
  "Vitamina C": "vitamin_c_mg",
  "Vitamina B12": "vitamin_b12_mcg",
  "Equivalente de folato": "folate_mcg"
};

function parseArgs(argv) {
  const args = {
    table: "taco",
    file: null,
    sql: false,
    push: false,
    download: false,
    clear: false,
    ingredientsOnly: true,
    complementTaco: true,
    batchSize: 200
  };

  for (const arg of argv) {
    if (arg.startsWith("--table=")) args.table = arg.split("=")[1];
    if (arg.startsWith("--file=")) args.file = arg.split("=")[1];
    if (arg === "--sql") args.sql = true;
    if (arg === "--push") args.push = true;
    if (arg === "--download") args.download = true;
    if (arg === "--clear") args.clear = true;
    if (arg === "--all") {
      args.ingredientsOnly = true;
      args.complementTaco = false;
    }
    if (arg === "--full") {
      args.ingredientsOnly = false;
      args.complementTaco = false;
    }
    if (arg.startsWith("--batch-size=")) args.batchSize = Number(arg.split("=")[1]);
  }

  return args;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  }

  return rows;
}

function parseJsonLines(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function toNumber(value) {
  if (value == null || value === "" || value === "NA" || value === "Tr" || value === "na") {
    return null;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function compactNutrition(per100g) {
  for (const key of Object.keys(per100g)) {
    if (per100g[key] == null) delete per100g[key];
  }
  return per100g;
}

function buildPer100gFromFlatRow(row) {
  const per100g = compactNutrition({
    kcal: toNumber(row.kcal ?? row.energia_kcal ?? row.energy_kcal),
    protein_g: toNumber(row.protein_g ?? row.proteina_g ?? row.proteinas),
    carbs_g: toNumber(row.carbs_g ?? row.carboidrato_g ?? row.carboidratos_g ?? row.carboidratos),
    fat_g: toNumber(row.fat_g ?? row.lipideos_g ?? row.lipidios_g ?? row.gorduras),
    fiber_g: toNumber(row.fiber_g ?? row.fibra_g ?? row.fibras),
    sodium_mg: toNumber(row.sodio_mg ?? row.sodium_mg),
    potassium_mg: toNumber(row.potassio_mg ?? row.potassium_mg),
    calcium_mg: toNumber(row.calcio_mg ?? row.calcium_mg),
    magnesium_mg: toNumber(row.magnesio_mg ?? row.magnesium_mg),
    phosphorus_mg: toNumber(row.fosforo_mg ?? row.phosphorus_mg),
    iron_mg: toNumber(row.ferro_mg ?? row.iron_mg),
    zinc_mg: toNumber(row.zinco_mg ?? row.zinc_mg),
    vitamin_a_mcg: toNumber(row.RAE_mcg ?? row.RE_mcg ?? row.vitamin_a_mcg),
    vitamin_c_mg: toNumber(row.vitamina_c_mg ?? row.vitamin_c_mg)
  });

  return sanitizePer100g(per100g);
}

function buildPer100gFromTbcaNutrients(nutrientes) {
  const per100g = {};

  for (const nutrient of nutrientes || []) {
    const component = nutrient.Componente;
    const units = nutrient.Unidades;
    const value = toNumber(nutrient["Valor por 100g"]);

    if (value == null) continue;

    if (component === "Energia" && units === "kcal") {
      per100g.kcal = value;
      continue;
    }

    const mapped = TBCA_COMPONENT_MAP[component];
    if (mapped) {
      per100g[mapped] = value;
    }
  }

  if (per100g.carbs_g == null && per100g.carbs_available_g != null) {
    per100g.carbs_g = per100g.carbs_available_g;
  }

  delete per100g.carbs_available_g;

  return sanitizePer100g(compactNutrition(per100g));
}

function shortenTbcaName(descricao) {
  return normalizeTbcaDisplayName(descricao);
}

function loadTacoLabelSet(filePath) {
  if (!fs.existsSync(filePath)) return new Set();

  const content = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(content);

  return new Set(
    rows
      .map((row) => row.descricao || row.name)
      .filter(Boolean)
      .map((label) => normalizeFoodLabel(label))
  );
}

function filterTbcaRows(rows, args) {
  if (args.table !== "tbca") return rows;

  let filtered = rows;

  if (args.complementTaco) {
    const tacoPath = path.resolve("data/taco-composicao.csv");
    const tacoLabels = loadTacoLabelSet(tacoPath);
    const before = filtered.length;
    filtered = filtered.filter((row) => isTbcaComplementFood(row, tacoLabels));
    console.error(
      `Filtro TBCA (complemento TACO): ${filtered.length} de ${before} registros mantidos.`
    );
    return filtered;
  }

  if (args.ingredientsOnly) {
    const before = filtered.length;
    filtered = filtered.filter((row) =>
      isTbcaIngredient({
        descricao: row.descricao,
        classe: row.classe,
        name: row.name,
        food_group: row.food_group
      })
    );
    console.error(
      `Filtro TBCA (ingredientes): ${filtered.length} de ${before} registros mantidos.`
    );
  }

  return filtered;
}

function normalizeRows(rows, table) {
  return rows
    .map((row) => {
      if (table === "tbca" && row.nutrientes) {
        const per100g = buildPer100gFromTbcaNutrients(row.nutrientes);
        const name = shortenTbcaName(row.descricao ?? row.name);

        if (!name || !per100g.kcal) return null;

        return {
          code: row.codigo || row.code || null,
          name,
          food_group: row.classe || row.food_group || row.grupo || null,
          per_100g: per100g
        };
      }

      const name = row.name ?? row.nome ?? row.alimento ?? row.descricao;
      const per100g = buildPer100gFromFlatRow(row);

      if (!name || !per100g.kcal) return null;

      if (table === "tbca") {
        return {
          code: row.code || row.codigo || null,
          name,
          food_group: row.food_group || row.grupo || row.categoria || null,
          per_100g: per100g
        };
      }

      return { name, per_100g: per100g };
    })
    .filter(Boolean);
}

function detectAndParse(content, filePath) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && !trimmed.startsWith("numero_alimento,")) {
    if (trimmed.startsWith("[") === false && trimmed.includes("\n{")) {
      return parseJsonLines(content);
    }

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return parseJsonLines(content);
    }
  }

  return parseCsv(content);
}

function toSql(table, rows) {
  const lines = [`-- Generated import for ${table} (${rows.length} rows)`, ""];

  for (const row of rows) {
    if (table === "tbca") {
      lines.push(
        `insert into public.foods_tbca (code, name, food_group, per_100g) values (` +
          `${row.code ? `'${row.code.replace(/'/g, "''")}'` : "null"}, ` +
          `'${row.name.replace(/'/g, "''")}', ` +
          `${row.food_group ? `'${row.food_group.replace(/'/g, "''")}'` : "null"}, ` +
          `'${JSON.stringify(row.per_100g).replace(/'/g, "''")}'::jsonb` +
          `) on conflict do nothing;`
      );
      continue;
    }

    lines.push(
      `insert into public.foods_taco (name, per_100g) values (` +
        `'${row.name.replace(/'/g, "''")}', ` +
        `'${JSON.stringify(row.per_100g).replace(/'/g, "''")}'::jsonb` +
        `);`
    );
  }

  return lines.join("\n");
}

async function downloadSource(table, destination) {
  const url = DOWNLOAD_URLS[table];
  if (!url) throw new Error(`Download não disponível para ${table}.`);

  console.error(`Baixando ${table} de ${url} ...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${table}: HTTP ${response.status}`);
  }

  const content = await response.text();
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, "utf8");
  console.error(`Salvo em ${destination}`);
  return destination;
}

function getSupabaseClient() {
  loadEnvFile(path.resolve(".env.local"));
  loadEnvFile(path.resolve(".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  }

  return createClient(url, key);
}

async function clearTable(supabase, table) {
  const target = table === "tbca" ? "foods_tbca" : "foods_taco";
  const { error, count } = await supabase.from(target).delete({ count: "exact" }).gte("id", 0);

  if (error) {
    throw new Error(`Erro ao limpar ${target}: ${error.message}`);
  }

  console.error(`Tabela ${target} limpa (${count ?? 0} registros removidos).`);
}

async function pushToSupabase(table, rows, batchSize, clear) {
  const supabase = getSupabaseClient();
  const target = table === "tbca" ? "foods_tbca" : "foods_taco";

  if (clear) {
    await clearTable(supabase, table);
  }

  for (let index = 0; index < rows.length; index += batchSize) {
    const chunk = rows.slice(index, index + batchSize);
    const { error } = await supabase.from(target).insert(chunk);

    if (error) {
      throw new Error(`Erro ao importar lote ${index / batchSize + 1}: ${error.message}`);
    }

    console.error(`Importados ${Math.min(index + batchSize, rows.length)} / ${rows.length}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!["taco", "tbca"].includes(args.table)) {
    console.error("Use --table=taco ou --table=tbca");
    process.exit(1);
  }

  let filePath = args.file ? path.resolve(args.file) : null;

  if (args.download) {
    const defaultFile =
      args.table === "tbca"
        ? path.resolve("data/tbca-alimentos.jsonl")
        : path.resolve("data/taco-composicao.csv");
    filePath = await downloadSource(args.table, defaultFile);
  }

  if (!filePath) {
    console.error(
      "Uso: node scripts/import-foods.mjs --table=taco|tbca [--download] [--file=./data/arquivo] [--sql|--push] [--clear]"
    );
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");
  let parsed = detectAndParse(content, filePath);

  if (args.table === "tbca" && args.complementTaco) {
    const tacoPath = path.resolve("data/taco-composicao.csv");
    if (!fs.existsSync(tacoPath)) {
      console.error("Base TACO local não encontrada; baixando para deduplicar...");
      await downloadSource("taco", tacoPath);
    }
  }

  parsed = filterTbcaRows(parsed, args);

  const rows = normalizeRows(parsed, args.table);

  if (!rows.length) {
    console.error("Nenhuma linha válida encontrada no arquivo.");
    process.exit(1);
  }

  console.error(`${rows.length} alimentos prontos para importação (${args.table}).`);

  if (args.sql) {
    process.stdout.write(toSql(args.table, rows));
    return;
  }

  if (args.push) {
    await pushToSupabase(args.table, rows, args.batchSize, args.clear);
    console.error(`Concluído: ${rows.length} alimentos em foods_${args.table}.`);
    return;
  }

  console.error("Use --push para enviar ao Supabase ou --sql para gerar SQL.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
