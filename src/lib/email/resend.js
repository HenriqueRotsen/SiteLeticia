import { Resend } from "resend";
import { brand, escapeHtml, wrapEmailDocument } from "@/lib/branding/shell";
import { getSiteUrl } from "@/lib/site-url";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }
  return new Resend(apiKey);
}

export function getEmailFrom() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Letícia Cunha <onboarding@resend.dev>"
  );
}

export async function sendEmail({ to, subject, html, text }) {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text
  });

  if (error) {
    throw new Error(error.message || "Falha ao enviar e-mail.");
  }

  return data;
}

function emailCtaButton({ href, label }) {
  const { colors } = brand;
  return `<a href="${escapeHtml(href)}" style="
    display:inline-block;
    background:${colors.olive700};
    color:${colors.white};
    text-decoration:none;
    padding:14px 22px;
    border-radius:999px;
    font-family:Inter,ui-sans-serif,system-ui,sans-serif;
    font-weight:700;
    font-size:12px;
    letter-spacing:0.14em;
    text-transform:uppercase;
  ">${escapeHtml(label)}</a>`;
}

function emailTitle(text) {
  return `<h1 style="
    margin:0 0 12px;
    font-family:Georgia,'Times New Roman',serif;
    font-size:28px;
    line-height:1.2;
    font-weight:400;
    color:${brand.colors.graphite};
  ">${escapeHtml(text)}</h1>`;
}

function emailParagraph(text) {
  return `<p style="
    margin:0 0 20px;
    font-family:Inter,ui-sans-serif,system-ui,sans-serif;
    font-size:15px;
    line-height:1.65;
    color:rgba(37,40,36,0.68);
  ">${escapeHtml(text)}</p>`;
}

function emailMuted(text) {
  return `<p style="
    margin:20px 0 0;
    font-family:Inter,ui-sans-serif,system-ui,sans-serif;
    font-size:12px;
    line-height:1.5;
    color:rgba(37,40,36,0.42);
  ">${escapeHtml(text)}</p>`;
}

export function passwordResetEmail({ resetUrl, siteUrl } = {}) {
  const resolvedSiteUrl = siteUrl || getSiteUrl();
  const subject = `Redefinir senha — ${brand.name}`;
  const text = `Olá!\n\nRecebemos um pedido para redefinir sua senha.\n\nAbra o link abaixo (válido por tempo limitado):\n${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.\n\n— ${brand.name}`;
  const bodyHtml = `
    ${emailTitle("Redefinir senha")}
    ${emailParagraph("Recebemos um pedido para redefinir a senha da sua conta.")}
    <div style="margin:8px 0 24px;">${emailCtaButton({ href: resetUrl, label: "Escolher nova senha" })}</div>
    <p style="margin:0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:1.55;color:rgba(37,40,36,0.55);">
      Se o botão não funcionar, copie e cole este link no navegador:<br/>
      <span style="word-break:break-all;color:${brand.colors.olive700};">${escapeHtml(resetUrl)}</span>
    </p>
    ${emailMuted("Se você não solicitou isso, ignore este e-mail.")}
  `;

  return {
    subject,
    text,
    html: wrapEmailDocument({
      title: subject,
      preheader: "Link para redefinir sua senha na plataforma Letícia Cunha.",
      bodyHtml,
      siteUrl: resolvedSiteUrl
    })
  };
}

export function loginOtpEmail({ code, siteUrl } = {}) {
  const resolvedSiteUrl = siteUrl || getSiteUrl();
  const safeCode = escapeHtml(code);
  const subject = `Seu código de acesso — ${brand.name}`;
  const text = `Seu código de verificação é: ${code}\n\nEle expira em 10 minutos. Se você não tentou entrar, ignore este e-mail.\n\n— ${brand.name}`;
  const bodyHtml = `
    ${emailTitle("Código de verificação")}
    ${emailParagraph("Use este código para concluir o login. Ele expira em 10 minutos.")}
    <div style="
      margin:8px 0 8px;
      padding:18px 16px;
      border-radius:16px;
      background:${brand.colors.linen};
      border:1px solid ${brand.colors.softBorder};
      text-align:center;
    ">
      <p style="
        margin:0;
        font-family:Inter,ui-sans-serif,system-ui,sans-serif;
        font-size:34px;
        letter-spacing:0.28em;
        font-weight:700;
        color:${brand.colors.graphite};
      ">${safeCode}</p>
    </div>
    ${emailMuted("Se você não tentou entrar, ignore este e-mail.")}
  `;

  return {
    subject,
    text,
    html: wrapEmailDocument({
      title: subject,
      preheader: `Seu código: ${code}`,
      bodyHtml,
      siteUrl: resolvedSiteUrl
    })
  };
}
