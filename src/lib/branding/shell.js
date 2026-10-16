/**
 * Identidade visual compartilhada (impressão + e-mail).
 * Cores alinhadas ao Tailwind do sistema (olive / graphite / porcelain / linen).
 */

export const brand = {
  name: "Letícia Cunha",
  tagline: "Saúde & Nutrição",
  role: "Nutricionista clínica",
  colors: {
    olive50: "#f6f0ea",
    olive100: "#ead8c8",
    olive500: "#7a4224",
    olive700: "#4f2819",
    olive800: "#3f2117",
    graphite: "#252824",
    porcelain: "#fbfaf5",
    linen: "#f2eee4",
    muted: "rgba(37, 40, 36, 0.58)",
    softBorder: "rgba(50, 28, 21, 0.10)",
    white: "#ffffff"
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Monograma LC — funciona em e-mail sem imagem externa. */
export function brandMonogramHtml({ size = 44 } = {}) {
  const fontSize = Math.round(size * 0.34);
  const radius = Math.round(size * 0.28);
  return `<div style="
    width:${size}px;height:${size}px;border-radius:${radius}px;
    background:${brand.colors.olive700};color:${brand.colors.white};
    font-family:Georgia,'Times New Roman',serif;font-size:${fontSize}px;font-weight:700;
    letter-spacing:0.04em;line-height:${size}px;text-align:center;
  ">LC</div>`;
}

export function brandHeaderHtml({ compact = false } = {}) {
  const titleSize = compact ? "18px" : "22px";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
      <tr>
        <td style="vertical-align:middle;width:${compact ? 40 : 48}px;padding:0 14px 0 0;">
          ${brandMonogramHtml({ size: compact ? 40 : 48 })}
        </td>
        <td style="vertical-align:middle;padding:0;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:${titleSize};line-height:1.2;color:${brand.colors.graphite};">
            ${escapeHtml(brand.name)}
          </p>
          <p style="margin:4px 0 0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(37,40,36,0.45);">
            ${escapeHtml(brand.tagline)}
          </p>
        </td>
      </tr>
    </table>
  `;
}

export function brandFooterHtml({ siteUrl } = {}) {
  const link = siteUrl
    ? `<a href="${escapeHtml(siteUrl)}" style="color:${brand.colors.olive700};text-decoration:none;">${escapeHtml(
        siteUrl.replace(/^https?:\/\//, "")
      )}</a>`
    : escapeHtml(brand.role);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;margin-top:28px;">
      <tr>
        <td style="border-top:1px solid ${brand.colors.softBorder};padding-top:18px;text-align:center;">
          <p style="margin:0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.5;color:rgba(37,40,36,0.42);">
            ${escapeHtml(brand.name)} · ${escapeHtml(brand.role)}
          </p>
          <p style="margin:6px 0 0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.5;color:rgba(37,40,36,0.38);">
            ${link}
          </p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Envelope visual para e-mails transacionais (OTP, reset, etc.).
 */
export function wrapEmailDocument({
  title,
  preheader = "",
  bodyHtml,
  siteUrl = ""
} = {}) {
  const { colors } = brand;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title || brand.name)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.porcelain};">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(
          preheader
        )}</div>`
      : ""
  }
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${colors.porcelain};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:560px;width:100%;">
          <tr>
            <td style="padding:0 0 18px;">
              ${brandHeaderHtml()}
            </td>
          </tr>
          <tr>
            <td style="
              background:${colors.white};
              border:1px solid ${colors.softBorder};
              border-radius:20px;
              padding:28px 28px 24px;
              box-shadow:0 12px 40px rgba(37,40,36,0.06);
            ">
              ${bodyHtml}
              ${brandFooterHtml({ siteUrl })}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 8px 0;text-align:center;">
              <p style="margin:0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:11px;line-height:1.5;color:rgba(37,40,36,0.35);">
                Este e-mail foi enviado automaticamente. Não responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Documento de impressão / PDF com a mesma identidade do sistema.
 * autoPrint: só use no fallback de popup; no iframe o host dispara print uma vez.
 */
export function wrapPrintDocument({
  title,
  subtitle,
  patientName,
  bodyHtml,
  autoPrint = false
} = {}) {
  const { colors } = brand;
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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: ${colors.graphite};
      background: ${colors.porcelain};
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      min-height: 100vh;
      padding: 28px 20px 40px;
      background:
        radial-gradient(circle at top left, rgba(122, 66, 36, 0.10), transparent 28rem),
        linear-gradient(160deg, ${colors.porcelain} 0%, ${colors.linen} 100%);
    }
    .sheet {
      max-width: 760px;
      margin: 0 auto;
      background: rgba(255,255,255,0.97);
      border: 1px solid ${colors.softBorder};
      border-radius: 24px;
      padding: 28px 28px 32px;
      box-shadow: 0 12px 40px rgba(37, 40, 36, 0.06);
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 1px solid ${colors.softBorder};
    }
    .brand-mark {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: ${colors.olive700};
      color: ${colors.white};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Instrument Serif", Georgia, serif;
      font-size: 18px;
      font-weight: 400;
      letter-spacing: 0.04em;
      box-shadow: 0 4px 14px rgba(79, 40, 25, 0.22);
    }
    .brand-name {
      margin: 0;
      font-family: "Instrument Serif", Georgia, serif;
      font-size: 22px;
      line-height: 1.15;
      color: ${colors.graphite};
    }
    .brand-tag {
      margin: 4px 0 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(37, 40, 36, 0.45);
    }
    .doc-kicker {
      margin: 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${colors.olive500};
    }
    h1 {
      margin: 8px 0 0;
      font-family: "Instrument Serif", Georgia, serif;
      font-size: 30px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      font-weight: 400;
      color: ${colors.graphite};
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      margin: 18px 0 8px;
      padding: 12px 14px;
      border-radius: 16px;
      background: ${colors.linen};
      border: 1px solid ${colors.softBorder};
      color: rgba(37, 40, 36, 0.62);
      font-size: 13px;
    }
    .meta strong { color: ${colors.graphite}; font-weight: 600; }
    .section { margin-top: 22px; }
    .section-label {
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(37, 40, 36, 0.45);
    }
    .card {
      border: 1px solid ${colors.softBorder};
      border-radius: 16px;
      background: ${colors.white};
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .card-title {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 650;
      color: ${colors.graphite};
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
      background: ${colors.olive50};
      color: ${colors.olive800};
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
      border-bottom: 1px solid rgba(50, 28, 21, 0.06);
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
      background: ${colors.olive500};
    }
    .letter {
      white-space: pre-wrap;
      margin: 0;
      padding: 14px 16px;
      border-radius: 16px;
      background: ${colors.linen};
      border: 1px solid ${colors.softBorder};
      font-size: 14px;
      line-height: 1.6;
      color: rgba(37, 40, 36, 0.78);
    }
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid ${colors.softBorder};
      font-size: 12px;
      color: rgba(37, 40, 36, 0.42);
      text-align: center;
    }
    .muted { color: rgba(37, 40, 36, 0.55); font-size: 13px; }
    .dose {
      color: ${colors.olive700};
      white-space: nowrap;
      font-weight: 600;
    }
    .row-alt { background: ${colors.olive50}; }
    .combo-label { color: ${colors.olive700}; }
    .combo-card { border-color: rgba(122, 66, 36, 0.18); }
    .combo-posology {
      padding: 12px 14px;
      border-top: 1px solid rgba(122, 66, 36, 0.12);
      font-size: 13px;
      color: ${colors.olive800};
    }
    .print-btn {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 12px 22px;
      background: ${colors.olive700};
      color: ${colors.white};
      font: 700 12px/1 Inter, system-ui, sans-serif;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
    }
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
      .brand-row { border-bottom-color: #ddd; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sheet">
      <div class="brand-row">
        <div class="brand-mark" aria-hidden="true">LC</div>
        <div>
          <p class="brand-name">${escapeHtml(brand.name)}</p>
          <p class="brand-tag">${escapeHtml(brand.tagline)}</p>
        </div>
      </div>
      <p class="doc-kicker">${escapeHtml(brand.role)}</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        ${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ""}
        <span>Paciente: <strong>${escapeHtml(patientName || "—")}</strong></span>
        <span>${escapeHtml(date)}</span>
      </div>
      ${bodyHtml}
      <div class="footer">${escapeHtml(brand.name)} · documento gerado pela plataforma</div>
      <div class="no-print" style="margin-top:18px;text-align:center">
        <button type="button" class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
      </div>
    </div>
  </div>
  ${
    autoPrint
      ? `<script>
    (function () {
      var printed = false;
      function run() {
        if (printed) return;
        printed = true;
        try { window.focus(); window.print(); } catch (e) {}
      }
      if (document.readyState === "complete") setTimeout(run, 300);
      else window.addEventListener("load", function () { setTimeout(run, 300); }, { once: true });
    })();
  </script>`
      : ""
  }
</body>
</html>`;
}

export { escapeHtml };
