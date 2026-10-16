"use client";

import { Printer } from "lucide-react";
import { btnSecondary } from "@/components/layout/AppShell";
import { brand, escapeHtml, wrapPrintDocument } from "@/lib/branding/shell";

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
  const html = wrapPrintDocument(options);

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
            (item, index) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 12px;" class="${
              index % 2 === 0 ? "row-alt" : ""
            }">
              <span style="font-size:14px">• ${escapeHtml(item.productName || "—")}</span>
              <span class="dose">${escapeHtml(item.dosage || "—")}</span>
            </div>`
          )
          .join("");
        return `<div class="section">
          <p class="section-label combo-label">${escapeHtml(entry.title || "Combo")}</p>
          <div class="card combo-card" style="padding:0;overflow:hidden">${rows || "<p class='card-line' style='padding:12px'>—</p>"}
            ${
              entry.posology
                ? `<div class="combo-posology"><strong>Posologia:</strong> ${escapeHtml(
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
                    (e) => `<div style="padding:8px 0;border-bottom:1px solid rgba(50,28,21,0.06)">
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

export { brand };
