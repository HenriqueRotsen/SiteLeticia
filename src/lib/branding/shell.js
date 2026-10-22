import { formatWhatsappDisplay, site } from "@/lib/marketing/content";

/**
 * Identidade visual compartilhada (impressão + e-mail).
 * Manual: #FFFFFF, #ECE3D8, #A3968E, #BD9B72 · Gentium Plus + Gotham.
 */

export const brand = {
  name: "Letícia Cunha",
  tagline: "Nutrição com método, história e cuidado.",
  domain: "Saúde & Nutrição",
  role: "Nutricionista",
  colors: {
    gold: "#BD9B72",
    taupe: "#A3968E",
    olive50: "#F8F3EC",
    olive100: "#ECE3D8",
    olive500: "#BD9B72",
    olive700: "#8C6E4A",
    olive800: "#6B5440",
    graphite: "#2F2A27",
    porcelain: "#FFFFFF",
    linen: "#ECE3D8",
    muted: "rgba(47, 42, 39, 0.58)",
    softBorder: "rgba(47, 42, 39, 0.10)",
    hairline: "rgba(163, 150, 142, 0.38)",
    paper: "#F4EFE7",
    paperLight: "#FAF7F2",
    ink: "#2B2220",
    white: "#ffffff"
  },
  fonts: {
    display: "Gentium Plus, Georgia, 'Times New Roman', serif",
    sans: "Gotham, ui-sans-serif, system-ui, sans-serif"
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Base absoluta dos assets (no e-mail vem do site; na impressão, da origem atual). */
function assetBase(siteUrl = "") {
  const explicit = String(siteUrl || "").replace(/\/$/, "");
  if (explicit) return explicit;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
}

/** Monograma LC — usa a marca oficial quando há URL absoluta (e-mail). */
export function brandMonogramHtml({ size = 44, siteUrl = "" } = {}) {
  const origin = assetBase(siteUrl);
  if (origin) {
    return `<img src="${escapeHtml(`${origin}/brand-mark.png`)}" alt="" width="${size}" style="display:block;width:${size}px;height:auto;" />`;
  }

  const fontSize = Math.round(size * 0.72);
  return `<div style="
    width:${size}px;height:${size}px;
    color:${brand.colors.gold};
    font-family:${brand.fonts.display};font-size:${fontSize}px;font-weight:400;
    line-height:${size}px;text-align:center;
  "><em style="font-style:italic;margin-right:-0.28em;">L</em>C</div>`;
}

/** Assinatura centralizada (monograma + nome + NUTRICIONISTA), como no papel timbrado. */
export function brandLockupHtml({ width = 190, siteUrl = "" } = {}) {
  const origin = assetBase(siteUrl);
  if (origin) {
    return `<img src="${escapeHtml(`${origin}/brand-stack.png`)}" alt="${escapeHtml(brand.name)} — ${escapeHtml(
      brand.role
    )}" width="${width}" style="display:block;margin:0 auto;width:${width}px;max-width:100%;height:auto;" />`;
  }

  return `<div style="text-align:center;">
    <div style="font-family:${brand.fonts.display};font-size:34px;line-height:1;color:${brand.colors.gold};">LC</div>
    <p style="margin:10px 0 0;font-family:${brand.fonts.display};font-size:20px;letter-spacing:0.08em;text-transform:uppercase;color:${brand.colors.ink};">${escapeHtml(
      brand.name
    )}</p>
    <p style="margin:6px 0 0;font-family:${brand.fonts.sans};font-size:9px;letter-spacing:0.34em;text-transform:uppercase;color:${brand.colors.ink};">${escapeHtml(
      brand.role
    )}</p>
  </div>`;
}

export function brandHeaderHtml({ siteUrl = "" } = {}) {
  return brandLockupHtml({ width: 180, siteUrl });
}

/** Linhas de contato (mesmo padrão do verso do cartão). */
export function brandContactLines() {
  return [
    { icon: "phone", text: formatWhatsappDisplay(site.whatsapp) },
    { icon: "mail", text: site.email },
    { icon: "instagram", text: `@${site.instagram}` },
    { icon: "pin", text: site.city }
  ].filter((line) => line.text);
}

const ICON_PATHS = {
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  instagram:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'
};

function contactIconSvg(name, size = 13) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${brand.colors.gold}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">${ICON_PATHS[name] || ""}</svg>`;
}

export function brandFooterHtml({ siteUrl } = {}) {
  const lines = brandContactLines()
    .map(
      (line) => `<tr>
        <td style="padding:3px 10px 3px 0;vertical-align:middle;width:16px;">${emailIconImg(line.icon, siteUrl)}</td>
        <td style="padding:3px 0;font-family:${brand.fonts.sans};font-size:12px;line-height:1.4;color:rgba(47,42,39,0.62);">${escapeHtml(
          line.text
        )}</td>
      </tr>`
    )
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:30px auto 0;">
      <tr>
        <td style="vertical-align:middle;padding:0 18px 0 0;border-right:1px solid ${brand.colors.softBorder};">
          ${brandMonogramHtml({ size: 34, siteUrl })}
        </td>
        <td style="vertical-align:middle;padding:0 0 0 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${lines}</table>
        </td>
      </tr>
    </table>
  `;
}

/** Ícones de e-mail: pontos dourados (SVG inline não é suportado de forma confiável em clientes de e-mail). */
function emailIconImg() {
  return `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${brand.colors.gold};"></span>`;
}

/**
 * Envelope visual para e-mails transacionais (OTP, reset, etc.).
 * Segue o papel timbrado: fundo creme, assinatura centralizada, cartão plano e rodapé de contato.
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
<body style="margin:0;padding:0;background:${colors.paper};">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(
          preheader
        )}</div>`
      : ""
  }
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${colors.paper};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:560px;width:100%;">
          <tr>
            <td style="padding:0 0 28px;text-align:center;">
              ${brandHeaderHtml({ siteUrl })}
            </td>
          </tr>
          <tr>
            <td style="
              background:${colors.paperLight};
              border:1px solid ${colors.hairline};
              border-radius:12px;
              padding:32px 30px 28px;
            ">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td>
              ${brandFooterHtml({ siteUrl })}
            </td>
          </tr>
          <tr>
            <td style="padding:26px 8px 0;text-align:center;">
              <p style="margin:0;font-family:${brand.fonts.sans};font-size:11px;line-height:1.5;color:rgba(47,42,39,0.38);">
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
 * Documento de impressão / PDF no padrão do papel timbrado:
 * fundo creme, assinatura centralizada no topo, curvas suaves ao fundo e contatos no rodapé.
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
  const origin = assetBase();
  const date = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const contact = brandContactLines()
    .map(
      (line) =>
        `<li>${contactIconSvg(line.icon)}<span>${escapeHtml(line.text)}</span></li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Gentium+Plus:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <style>
    @font-face {
      font-family: Gotham;
      src: url("${origin}/fonts/gotham/Gotham-Book.otf") format("opentype");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: Gotham;
      src: url("${origin}/fonts/gotham/Gotham-Medium.otf") format("opentype");
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: Gotham;
      src: url("${origin}/fonts/gotham/Gotham-Bold.otf") format("opentype");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: ${colors.paper}; }
    body {
      color: ${colors.graphite};
      font-family: Gotham, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { padding: 28px 16px 40px; background: #e7dfd3; }
    .sheet {
      position: relative;
      overflow: hidden;
      width: min(210mm, 100%);
      min-height: 297mm;
      margin: 0 auto;
      background: ${colors.paper};
      box-shadow: 0 18px 50px rgba(47, 42, 39, 0.14);
    }
    .frame { width: 100%; border-collapse: collapse; position: relative; z-index: 1; }
    .frame td { padding: 0; }
    .pad-top { height: 14mm; }
    .pad-bottom { height: 44mm; }
    .content { padding: 0 18mm !important; }
    .arcs {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 120mm;
      z-index: 0;
      pointer-events: none;
    }
    .contact {
      position: absolute;
      left: 18mm;
      bottom: 14mm;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .contact img { display: block; width: 32px; height: auto; }
    .contact .divider { align-self: stretch; width: 1px; background: ${colors.hairline}; }
    .contact ul { list-style: none; margin: 0; padding: 0; }
    .contact li {
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 3px 0;
      font-size: 10.5px;
      line-height: 1.4;
      color: rgba(47, 42, 39, 0.62);
    }
    .letterhead { text-align: center; padding-bottom: 8mm; }
    .letterhead img { display: block; width: 190px; height: auto; margin: 0 auto; }
    .doc-kicker {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: ${colors.olive700};
    }
    .doc-kicker::before {
      content: "";
      width: 28px;
      height: 1px;
      background: ${colors.gold};
    }
    h1 {
      margin: 10px 0 0;
      font-family: "Gentium Plus", Georgia, serif;
      font-size: 30px;
      line-height: 1.12;
      letter-spacing: -0.01em;
      font-weight: 400;
      color: ${colors.ink};
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 18px;
      margin: 16px 0 6px;
      padding: 12px 0;
      border-top: 1px solid ${colors.hairline};
      border-bottom: 1px solid ${colors.hairline};
      color: rgba(47, 42, 39, 0.62);
      font-size: 12.5px;
    }
    .meta strong { color: ${colors.ink}; font-weight: 600; }
    .section { margin-top: 22px; }
    .section-label {
      margin: 0 0 10px;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${colors.olive700};
    }
    .card {
      border: 1px solid ${colors.hairline};
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.55);
      padding: 13px 16px;
      margin-bottom: 10px;
      break-inside: avoid;
    }
    .card-title {
      margin: 0 0 4px;
      font-size: 14.5px;
      font-weight: 600;
      color: ${colors.ink};
    }
    .card-line {
      margin: 2px 0;
      font-size: 12.5px;
      color: rgba(47, 42, 39, 0.66);
      line-height: 1.5;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      padding: 2px 9px;
      border-radius: 999px;
      background: ${colors.olive100};
      color: ${colors.olive800};
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: none;
    }
    .chip-amber { background: #f3e3c7; color: #7a5321; }
    .list { margin: 0; padding: 0; list-style: none; }
    .list li {
      position: relative;
      padding: 7px 0 7px 18px;
      border-bottom: 1px solid rgba(47, 42, 39, 0.07);
      font-size: 13.5px;
      line-height: 1.45;
    }
    .list li:last-child { border-bottom: 0; }
    .list li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 13px;
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: ${colors.gold};
    }
    .letter {
      white-space: pre-wrap;
      margin: 0;
      padding: 14px 16px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid ${colors.hairline};
      font-size: 13.5px;
      line-height: 1.65;
      color: rgba(47, 42, 39, 0.8);
    }
    .muted { color: rgba(47, 42, 39, 0.55); font-size: 13px; }
    .dose { color: ${colors.olive700}; white-space: nowrap; font-weight: 600; }
    .row-alt { background: rgba(189, 155, 114, 0.1); }
    .combo-label { color: ${colors.olive700}; }
    .combo-card { border-color: rgba(189, 155, 114, 0.38); }
    .combo-posology {
      padding: 12px 14px;
      border-top: 1px solid rgba(189, 155, 114, 0.28);
      font-size: 12.5px;
      color: ${colors.olive800};
    }
    .print-btn {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 12px 22px;
      background: ${colors.olive700};
      color: ${colors.white};
      font: 700 12px/1 Gotham, system-ui, sans-serif;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
    }
    @media print {
      .page { padding: 0; background: ${colors.paper}; }
      .sheet { width: 100%; min-height: 0; box-shadow: none; overflow: visible; }
      .arcs, .contact { position: fixed; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sheet">
      <svg class="arcs" viewBox="0 0 600 480" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <g fill="none" stroke="${colors.gold}" stroke-linecap="round">
          <path d="M-40 470 C 120 300, 330 290, 640 130" stroke-width="46" opacity="0.10"/>
          <path d="M150 520 C 170 330, 330 170, 650 150" stroke-width="30" opacity="0.10"/>
          <path d="M-40 430 C 140 340, 360 330, 640 190" stroke-width="1.2" opacity="0.35"/>
          <path d="M210 520 C 210 360, 360 230, 650 215" stroke-width="1.2" opacity="0.35"/>
        </g>
      </svg>

      <table class="frame">
        <thead><tr><td><div class="pad-top"></div></td></tr></thead>
        <tbody>
          <tr>
            <td class="content">
              <div class="letterhead">
                <img src="${origin}/brand-stack.png" alt="${escapeHtml(brand.name)} — ${escapeHtml(brand.role)}" />
              </div>
              <p class="doc-kicker">${escapeHtml(subtitle || brand.role)}</p>
              <h1>${escapeHtml(title)}</h1>
              <div class="meta">
                <span>Paciente: <strong>${escapeHtml(patientName || "—")}</strong></span>
                <span>${escapeHtml(date)}</span>
              </div>
              ${bodyHtml}
              <div class="no-print" style="margin-top:22px;text-align:center">
                <button type="button" class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot><tr><td><div class="pad-bottom"></div></td></tr></tfoot>
      </table>

      <div class="contact">
        <img src="${origin}/brand-mark.png" alt="" />
        <span class="divider"></span>
        <ul>${contact}</ul>
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
