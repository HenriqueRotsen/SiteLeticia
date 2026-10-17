#!/usr/bin/env node
/**
 * Falha o CI se houver high/critical fora da allowlist documentada.
 * Uso: npm audit --json | node scripts/check-npm-audit.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const allowlist = JSON.parse(readFileSync(join(root, ".github/audit-allowlist.json"), "utf8"));
const allowed = new Set(Object.keys(allowlist.packages || {}));

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const raw = Buffer.concat(chunks).toString("utf8").trim();

let report;
try {
  report = JSON.parse(raw || "{}");
} catch {
  console.error("Não foi possível ler o JSON do npm audit.");
  process.exit(1);
}

const vulns = report.vulnerabilities || {};
const blocking = [];
const allowedHits = [];

for (const [name, info] of Object.entries(vulns)) {
  const severity = info.severity;
  if (severity !== "high" && severity !== "critical") continue;
  if (allowed.has(name)) {
    allowedHits.push(`${severity.toUpperCase()} ${name} (allowlisted)`);
    continue;
  }
  blocking.push(`${severity.toUpperCase()} ${name}`);
}

if (allowedHits.length) {
  console.log("Allowlisted (documentados):\n- " + allowedHits.join("\n- "));
}

if (blocking.length) {
  console.error("\nVulnerabilidades high/critical fora da allowlist:\n- " + blocking.join("\n- "));
  console.error("\nCorrija as deps ou documente em .github/audit-allowlist.json com justificativa.");
  process.exit(1);
}

console.log("\nnpm audit OK (sem high/critical fora da allowlist).");
process.exit(0);
