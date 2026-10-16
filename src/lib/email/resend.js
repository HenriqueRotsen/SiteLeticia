import { Resend } from "resend";

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

export function passwordResetEmail({ resetUrl }) {
  const subject = "Redefinir senha — Letícia Cunha";
  const text = `Olá!\n\nRecebemos um pedido para redefinir sua senha.\n\nAbra o link abaixo (válido por tempo limitado):\n${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.`;
  const html = `
    <div style="font-family:Georgia,serif;background:#f7f4ef;padding:32px;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4ddd2;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7a4e;">Letícia Cunha</p>
        <h1 style="margin:0 0 16px;font-size:24px;color:#2f3430;">Redefinir senha</h1>
        <p style="margin:0 0 20px;line-height:1.6;color:#4a524c;">Recebemos um pedido para redefinir a senha da sua conta.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#5c6b3f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Escolher nova senha</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#7a847c;">Se o botão não funcionar, copie e cole este link no navegador:<br/><span style="word-break:break-all;color:#5c6b3f;">${resetUrl}</span></p>
        <p style="margin:20px 0 0;font-size:12px;color:#9aa39a;">Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    </div>
  `;
  return { subject, html, text };
}

export function loginOtpEmail({ code }) {
  const subject = "Seu código de acesso — Letícia Cunha";
  const text = `Seu código de verificação é: ${code}\n\nEle expira em 10 minutos. Se você não tentou entrar, ignore este e-mail.`;
  const html = `
    <div style="font-family:Georgia,serif;background:#f7f4ef;padding:32px;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4ddd2;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7a4e;">Letícia Cunha</p>
        <h1 style="margin:0 0 16px;font-size:24px;color:#2f3430;">Código de verificação</h1>
        <p style="margin:0 0 20px;line-height:1.6;color:#4a524c;">Use este código para concluir o login. Ele expira em 10 minutos.</p>
        <p style="margin:0;font-size:36px;letter-spacing:0.28em;font-weight:700;color:#2f3430;">${code}</p>
        <p style="margin:24px 0 0;font-size:12px;color:#9aa39a;">Se você não tentou entrar, ignore este e-mail.</p>
      </div>
    </div>
  `;
  return { subject, html, text };
}
