"use client";

import { Printer } from "lucide-react";
import { btnSecondary } from "@/components/layout/AppShell";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPrintHtml({ title, subtitle, patientName, bodyHtml }) {
  const date = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #252824;
      background: #fbfaf5;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .page {
      min-height: 100vh;
      padding: 28px 20px 40px;
      background:
        radial-gradient(circle at top left, rgba(122, 66, 36, 0.10), transparent 28rem),
        linear-gradient(135deg, #fbfaf5 0%, #f2eee4 100%);
    }
    .sheet {
      max-width: 760px;
      margin: 0 auto;
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(79, 40, 25, 0.10);
      border-radius: 24px;
      padding: 28px 28px 32px;
      box-shadow: 0 12px 40px rgba(37, 40, 36, 0.06);
    }
    .eyebrow {
      margin: 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(63, 84, 42, 0.72);
    }
    h1 {
      margin: 8px 0 0;
      font-size: 26px;
      line-height: 1.2;
      letter-spacing: -0.02em;
      font-weight: 650;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      margin: 16px 0 22px;
      padding: 12px 14px;
      border-radius: 16px;
      background: #f7f4ef;
      border: 1px solid rgba(79, 40, 25, 0.08);
      color: rgba(37, 40, 36, 0.62);
      font-size: 13px;
    }
    .meta strong { color: #252824; font-weight: 600; }
    .section {
      margin-top: 22px;
    }
    .section-label {
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(37, 40, 36, 0.45);
    }
    .card {
      border: 1px solid rgba(79, 40, 25, 0.08);
      border-radius: 16px;
      background: #fff;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .card-title {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 650;
      color: #252824;
    }
    .card-line {
      margin: 2px 0;
      font-size: 13px;
      color: rgba(37, 40, 36, 0.62);
      line-height: 1.45;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #eef3e4;
      color: #3f542a;
      font-size: 11px;
      font-weight: 600;
    }
    .chip-amber {
      background: #fef3c7;
      color: #92400e;
    }
    .list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .list li {
      position: relative;
      padding: 8px 0 8px 18px;
      border-bottom: 1px solid rgba(79, 40, 25, 0.06);
      font-size: 14px;
      line-height: 1.45;
    }
    .list li:last-child { border-bottom: 0; }
    .list li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 14px;
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #6b7a4e;
    }
    .letter {
      white-space: pre-wrap;
      margin: 0;
      padding: 14px 16px;
      border-radius: 16px;
      background: #f7f4ef;
      border: 1px solid rgba(79, 40, 25, 0.08);
      font-size: 14px;
      line-height: 1.6;
      color: rgba(37, 40, 36, 0.78);
    }
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid rgba(79, 40, 25, 0.08);
      font-size: 12px;
      color: rgba(37, 40, 36, 0.42);
      text-align: center;
    }
    .muted { color: rgba(37, 40, 36, 0.55); font-size: 13px; }
    @media print {
      body, .page { background: #fff; }
      .page { padding: 0; }
      .sheet {
        border: 0;
        border-radius: 0;
        box-shadow: none;
        max-width: none;
        padding: 0;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sheet">
      <p class="eyebrow">Letícia Cunha · Nutrição</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        ${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ""}
        <span>Paciente: <strong>${escapeHtml(patientName || "—")}</strong></span>
        <span>${escapeHtml(date)}</span>
      </div>
      ${bodyHtml}
      <div class="footer">Use Imprimir do navegador para salvar em PDF</div>
      <div class="no-print" style="margin-top:18px;text-align:center">
        <button type="button" onclick="window.print()" style="
          appearance:none;border:0;border-radius:12px;padding:10px 18px;
          background:#4f2819;color:#fff;font:600 14px Inter,system-ui,sans-serif;cursor:pointer
        ">Imprimir / Salvar PDF</button>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 300);
    });
  </script>
</body>
</html>`;
}

function printViaIframe(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  );
  iframe.setAttribute("title", "Impressão");
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 1000);
  };

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const runPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      // ignore
    }
    win.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 120000);
  };

  if (doc.readyState === "complete") {
    setTimeout(runPrint, 250);
  } else {
    win.addEventListener("load", () => setTimeout(runPrint, 250), { once: true });
  }

  return true;
}

export function openPrescriptionPrint(options) {
  const html = buildPrintHtml(options);

  // 1) Iframe same-origin: não depende de pop-up e evita aba about:blank vazia.
  if (printViaIframe(html)) return true;

  // 2) Fallback: abrir Blob em nova aba (útil se o iframe for bloqueado).
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    // Não usar noopener no features string: o open retorna null.
    const popup = window.open(url, "_blank", "width=900,height=1000");
    if (!popup) {
      URL.revokeObjectURL(url);
      return false;
    }
    try {
      popup.opener = null;
    } catch {
      // ignore
    }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch {
    return false;
  }
}

export function buildSupplementsPrintHtml(entries = []) {
  if (!entries.length) return `<p class="muted">Nenhum suplemento prescrito.</p>`;

  return entries
    .map((entry) => {
      if (entry.kind === "group") {
        const rows = (entry.items || [])
          .map(
            (item, index) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 12px;${
              index % 2 === 0 ? "background:#f5f3ff;" : "background:#fff;"
            }">
              <span style="font-size:14px">• ${escapeHtml(item.productName || "—")}</span>
              <span style="font-size:14px;color:#5b21b6;white-space:nowrap;font-weight:500">${escapeHtml(
                item.dosage || "—"
              )}</span>
            </div>`
          )
          .join("");
        return `<div class="section">
          <p class="section-label" style="color:#6d28d9">${escapeHtml(entry.title || "Combo")}</p>
          <div class="card" style="padding:0;overflow:hidden;border-color:rgba(109,40,217,0.18)">${rows || "<p class='card-line' style='padding:12px'>—</p>"}
            ${
              entry.posology
                ? `<div style="padding:12px 14px;border-top:1px solid rgba(109,40,217,0.12);font-size:13px;color:#4c1d95"><strong>Posologia:</strong> ${escapeHtml(
                    entry.posology
                  )}</div>`
                : ""
            }
          </div>
        </div>`;
      }

      return `<div class="section">
        <div class="card">
          <p class="card-title">${escapeHtml(entry.productName || "Suplemento")}</p>
          <p class="card-line"><strong>Dosagem:</strong> ${escapeHtml(entry.dosage || "—")}</p>
          <p class="card-line"><strong>Posologia:</strong> ${escapeHtml(entry.posology || "—")}</p>
          ${entry.notes ? `<p class="card-line">${escapeHtml(entry.notes)}</p>` : ""}
        </div>
      </div>`;
    })
    .join("");
}

export function buildReferralsPrintHtml(items = []) {
  if (!items.length) return `<p class="muted">Nenhum encaminhamento.</p>`;
  return items
    .map(
      (item) => `<div class="section">
      <p class="section-label">${escapeHtml(item.specialty || "Encaminhamento")}${
        item.urgency === "priority" ? `<span class="chip chip-amber">Prioritário</span>` : ""
      }</p>
      ${item.reason ? `<p class="card-line" style="margin-bottom:10px">${escapeHtml(item.reason)}</p>` : ""}
      ${item.bodyText ? `<p class="letter">${escapeHtml(item.bodyText)}</p>` : ""}
      ${item.professionalName ? `<p class="card-line" style="margin-top:10px">Profissional: ${escapeHtml(item.professionalName)}</p>` : ""}
      ${item.notes ? `<p class="card-line">${escapeHtml(item.notes)}</p>` : ""}
    </div>`
    )
    .join("");
}

function buildExamMetaHtml(meta = {}) {
  const rows = [
    ["Nutricionista", meta.nutricionista],
    ["CRN", meta.crn],
    ["Endereço", meta.endereco],
    ["Contato", [meta.telefone, meta.email].filter(Boolean).join(" · ")],
    ["Paciente", meta.paciente],
    ["Nascimento", meta.data_nascimento],
    ["Sexo", meta.sexo],
    ["Data da solicitação", meta.data_solicitacao]
  ].filter(([, value]) => value);

  if (!rows.length) return "";
  return `<div class="card" style="margin-bottom:14px">
    <p class="card-title">Identificação</p>
    ${rows
      .map(
        ([label, value]) =>
          `<p class="card-line"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
      )
      .join("")}
  </div>`;
}

export function buildExamOrdersPrintHtml(orders = []) {
  if (!orders.length) return `<p class="muted">Nenhum pedido de exames.</p>`;
  return orders
    .map((order) => {
      const principals = (order.exams || []).filter((e) => e.category !== "complementary");
      const comps = (order.exams || []).filter((e) => e.category === "complementary");
      return `
        <div class="section">
          <p class="section-label">${escapeHtml(order.title || "Pedido de exames")}</p>
          ${buildExamMetaHtml(order.meta || {})}
          <div class="card">
            <p class="card-title">Exames principais</p>
            <ul class="list">${
              principals.map((e) => `<li>${escapeHtml(e.name)}</li>`).join("") ||
              "<li>—</li>"
            }</ul>
          </div>
          ${
            comps.length
              ? `<div class="card"><p class="card-title">Complementares</p>${comps
                  .map(
                    (e) => `<div style="padding:8px 0;border-bottom:1px solid rgba(79,40,25,0.06)">
                    <div style="font-weight:600;font-size:14px">${escapeHtml(e.name)}</div>
                    ${
                      e.whenToRequest
                        ? `<div class="card-line">${escapeHtml(e.whenToRequest)}</div>`
                        : ""
                    }
                  </div>`
                  )
                  .join("")}</div>`
              : ""
          }
          ${
            (order.collectionNotes || []).length
              ? `<div class="card"><p class="card-title">Orientações de coleta</p>
                 <ul class="list">${order.collectionNotes
                   .map((n) => `<li>${escapeHtml(n)}</li>`)
                   .join("")}</ul></div>`
              : ""
          }
          ${
            order.observations
              ? `<div class="card"><p class="card-title">Observações</p>
                 <p class="card-line">${escapeHtml(order.observations)}</p></div>`
              : ""
          }
        </div>`;
    })
    .join("");
}

export function buildDietPrintHtml(plan) {
  const meals = plan?.meals || [];
  if (!meals.length) return `<p class="muted">Sem refeições.</p>`;
  return meals
    .map((meal) => {
      const items = (meal.items || [])
        .map((item) => {
          const amount =
            item.nutritionSnapshot?.amountLabel ||
            `${item.measureAmount || item.portionG || ""}${
              item.measureUnit ? ` ${item.measureUnit}` : " g"
            }`;
          return `<li><strong>${escapeHtml(item.label)}</strong> <span class="muted">· ${escapeHtml(
            amount
          )}</span></li>`;
        })
        .join("");
      return `<div class="section"><p class="section-label">${escapeHtml(
        meal.name
      )}</p><div class="card"><ul class="list">${items}</ul></div></div>`;
    })
    .join("");
}

export default function PrescriptionPrintButton({
  title,
  subtitle,
  patientName,
  bodyHtml,
  label = "Imprimir / Salvar"
}) {
  return (
    <button
      type="button"
      className={btnSecondary()}
      onClick={() => {
        const ok = openPrescriptionPrint({
          title,
          subtitle,
          patientName,
          bodyHtml
        });
        if (!ok) {
          window.alert(
            "Não foi possível abrir a impressão. Permita pop-ups para este site e tente de novo."
          );
        }
      }}
    >
      <Printer className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}
