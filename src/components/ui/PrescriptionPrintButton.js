"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Printer, Share2, X } from "lucide-react";
import { btnSecondary } from "@/components/layout/AppShell";
import { useDialog } from "@/components/ui/ConfirmDialog";
import { brand, escapeHtml, wrapPrintDocument } from "@/lib/branding/shell";
import { formatNutrientValue } from "@/lib/foods/nutrition";

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

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      // ignore
    }
    win.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 120000);
  };

  doc.open();
  doc.write(html);
  doc.close();

  // Dispara print uma única vez (sem script autoPrint no HTML do iframe).
  const schedule = () => setTimeout(runPrint, 300);
  if (doc.readyState === "complete") {
    schedule();
  } else {
    win.addEventListener("load", schedule, { once: true });
    // Fallback caso o load não dispare após doc.write
    setTimeout(runPrint, 800);
  }

  return true;
}

export function openPrescriptionPrint(options) {
  // Iframe: host controla o print (autoPrint false).
  const iframeHtml = wrapPrintDocument({ ...options, autoPrint: false });
  if (printViaIframe(iframeHtml)) return true;

  // Fallback popup: o documento dispara o print sozinho.
  try {
    const popupHtml = wrapPrintDocument({ ...options, autoPrint: true });
    const blob = new Blob([popupHtml], { type: "text/html;charset=utf-8" });
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

function macroValue(key, value) {
  return escapeHtml(formatNutrientValue(key, value));
}

function macrosLine(totals) {
  if (!totals || totals.kcal == null) return "";
  return `<div class="macros">
    <span class="macro-kcal">${macroValue("kcal", totals.kcal)}</span>
    <span>Proteínas <strong>${macroValue("protein_g", totals.protein_g)}</strong></span>
    <span>Carboidratos <strong>${macroValue("carbs_g", totals.carbs_g)}</strong></span>
    <span>Gorduras <strong>${macroValue("fat_g", totals.fat_g)}</strong></span>
  </div>`;
}

function totalsCard(totals) {
  if (!totals || totals.kcal == null) return "";
  const cell = (key, label) =>
    `<div><span class="v">${macroValue(key, totals[key])}</span><span class="l">${label}</span></div>`;
  return `<div class="totals-card">
    <p class="section-label" style="margin:0">Total da dieta (por dia)</p>
    <div class="totals-grid">
      ${cell("kcal", "Energia")}${cell("protein_g", "Proteínas")}${cell("carbs_g", "Carboidratos")}${cell("fat_g", "Gorduras")}
    </div>
  </div>`;
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
      )}</p><div class="card"><ul class="list">${items}</ul>${macrosLine(meal.totals)}</div></div>`;
    })
    .join("") + totalsCard(plan.totals);
}

// Visualização do documento no celular (em tela cheia), com botão para salvar/compartilhar como PDF.
function PdfPreview({ title, html, onClose }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function savePdf() {
    try {
      frameRef.current?.contentWindow?.focus();
      frameRef.current?.contentWindow?.print();
    } catch {
      // ignore
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[65] flex flex-col bg-[#e7dfd3]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center gap-2 border-b border-olive-900/10 bg-porcelain px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-graphite/70 hover:bg-linen"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-graphite">{title}</p>
        <button
          type="button"
          onClick={savePdf}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-olive-700 px-3 py-2 text-xs font-semibold text-white"
        >
          <Share2 className="h-4 w-4" />
          Salvar PDF
        </button>
      </div>
      <iframe ref={frameRef} title={title} srcDoc={html} className="min-h-0 w-full flex-1 border-0 bg-white" />
    </div>,
    document.body
  );
}

export default function PrescriptionPrintButton({
  title,
  subtitle,
  patientName,
  bodyHtml,
  label = "Imprimir / Salvar",
  mobileLabel = "Ver PDF"
}) {
  const { alert } = useDialog();
  const [preview, setPreview] = useState(null);

  return (
    <>
      <button
        type="button"
        className={`${btnSecondary()} !hidden sm:!inline-flex`}
        onClick={() => {
          const ok = openPrescriptionPrint({
            title,
            subtitle,
            patientName,
            bodyHtml
          });
          if (!ok) {
            alert({
              title: "Não foi possível abrir a impressão",
              message: "Permita pop-ups para este site e tente de novo."
            });
          }
        }}
      >
        <Printer className="h-4 w-4" strokeWidth={1.75} />
        {label}
      </button>
      <button
        type="button"
        className={`${btnSecondary()} sm:!hidden`}
        onClick={() => setPreview(wrapPrintDocument({ title, subtitle, patientName, bodyHtml, autoPrint: false }))}
      >
        <FileText className="h-4 w-4" strokeWidth={1.75} />
        {mobileLabel}
      </button>
      {preview ? <PdfPreview title={title} html={preview} onClose={() => setPreview(null)} /> : null}
    </>
  );
}

export { brand };
