import { Resend } from "resend";
import { brand, escapeHtml, wrapEmailDocument } from "@/lib/branding/shell";
import { getSiteUrl } from "@/lib/site-url";
import { TIMEZONE } from "@/lib/constants";

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
    font-family:Gotham,ui-sans-serif,system-ui,sans-serif;
    font-weight:700;
    font-size:12px;
    letter-spacing:0.14em;
    text-transform:uppercase;
  ">${escapeHtml(label)}</a>`;
}

function emailTitle(text) {
  return `<h1 style="
    margin:0 0 12px;
    font-family:Gentium Plus,Georgia,'Times New Roman',serif;
    font-size:28px;
    line-height:1.2;
    font-weight:400;
    color:${brand.colors.graphite};
  ">${escapeHtml(text)}</h1>`;
}

function emailParagraph(text) {
  return `<p style="
    margin:0 0 20px;
    font-family:Gotham,ui-sans-serif,system-ui,sans-serif;
    font-size:15px;
    line-height:1.65;
    color:rgba(37,40,36,0.68);
  ">${escapeHtml(text)}</p>`;
}

function emailMuted(text) {
  return `<p style="
    margin:20px 0 0;
    font-family:Gotham,ui-sans-serif,system-ui,sans-serif;
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
    <p style="margin:0;font-family:Gotham,ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:1.55;color:rgba(47,42,39,0.55);">
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
        font-family:Gotham,ui-sans-serif,system-ui,sans-serif;
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

function formatAppointmentWhen(startsAt) {
  const date = new Date(startsAt);
  const day = date.toLocaleDateString("pt-BR", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const time = date.toLocaleTimeString("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} às ${time}`;
}

function firstName(fullName) {
  return String(fullName || "").trim().split(/\s+/)[0] || "";
}

/**
 * E-mail enviado ao agendar a primeira consulta, com o link da ficha pré-consulta.
 * kind: "invite" (logo após agendar) | "day" (1 dia antes) | "hour" (1 hora antes)
 */
export function preconsultEmail({ kind = "invite", fullName, startsAt, siteUrl } = {}) {
  const resolvedSiteUrl = siteUrl || getSiteUrl();
  const formUrl = `${resolvedSiteUrl}/app/ficha`;
  const when = formatAppointmentWhen(startsAt);
  const name = firstName(fullName);
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  const copy = {
    invite: {
      subject: `Sua consulta está agendada — preencha a ficha (5 min) | ${brand.name}`,
      title: "Consulta agendada",
      intro: `Sua consulta com a ${brand.name} está marcada para ${when}.`,
      ask: "Para a Letícia aproveitar melhor o nosso tempo, preencha a ficha pré-consulta. Leva cerca de 5 minutos, quase tudo em toques. É opcional, mas faz muita diferença.",
      preheader: `Consulta em ${when}. Preencha a ficha pré-consulta em 5 minutos.`
    },
    day: {
      subject: `Amanhã é a sua consulta — falta a ficha pré-consulta | ${brand.name}`,
      title: "Sua consulta é amanhã",
      intro: `Lembrando: sua consulta é ${when}.`,
      ask: "Ainda não recebemos a sua ficha pré-consulta. Leva cerca de 5 minutos e ajuda a Letícia a preparar o atendimento.",
      preheader: `Consulta ${when}. Falta só a ficha pré-consulta.`
    },
    hour: {
      subject: `Sua consulta é daqui a pouco — dá tempo da ficha | ${brand.name}`,
      title: "Sua consulta é daqui a pouco",
      intro: `Sua consulta começa às ${when.split(" às ")[1]}.`,
      ask: "Se der tempo, preencha agora a ficha pré-consulta (cerca de 5 minutos). Se não der, tudo bem, a Letícia conversa com você na consulta.",
      preheader: "Sua consulta começa em cerca de 1 hora."
    }
  }[kind];

  const text = `${greeting}\n\n${copy.intro}\n\n${copy.ask}\n\nPreencher a ficha: ${formUrl}\n\n— ${brand.name}`;
  const bodyHtml = `
    ${emailTitle(copy.title)}
    ${emailParagraph(`${greeting} ${copy.intro}`)}
    ${emailParagraph(copy.ask)}
    <div style="margin:8px 0 24px;">${emailCtaButton({ href: formUrl, label: "Preencher a ficha" })}</div>
    <p style="margin:0;font-family:Gotham,ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:1.55;color:rgba(47,42,39,0.55);">
      Se o botão não funcionar, copie e cole este link no navegador:<br/>
      <span style="word-break:break-all;color:${brand.colors.olive700};">${escapeHtml(formUrl)}</span>
    </p>
    ${emailMuted("Você precisa estar com a sua conta aberta para preencher. A ficha salva automaticamente o seu progresso.")}
  `;

  return {
    subject: copy.subject,
    text,
    html: wrapEmailDocument({
      title: copy.subject,
      preheader: copy.preheader,
      bodyHtml,
      siteUrl: resolvedSiteUrl
    })
  };
}
