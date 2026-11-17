// Lê o "PIX copia e cola" (BR Code, padrão EMV do Banco Central) para conferir se é válido
// e qual valor ele cobra. Não gera código: a Letícia cola o código gerado no app do banco.

export function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function readFields(text) {
  const fields = {};
  let i = 0;
  while (i + 4 <= text.length) {
    const id = text.slice(i, i + 2);
    const len = Number(text.slice(i + 2, i + 4));
    if (!Number.isInteger(len)) return null;
    const value = text.slice(i + 4, i + 4 + len);
    if (value.length !== len) return null;
    fields[id] = value;
    i += 4 + len;
  }
  return i === text.length ? fields : null;
}

export function normalizePixCode(raw) {
  return String(raw || "").replace(/[\r\n]+/g, "").trim();
}

export function parsePixCode(raw) {
  const code = normalizePixCode(raw);
  if (!code) return { valid: false, error: "empty" };
  if (!code.startsWith("000201")) return { valid: false, error: "Não parece um PIX copia e cola (deve começar com 000201)." };
  const crcIndex = code.lastIndexOf("6304");
  if (crcIndex < 0 || crcIndex + 8 !== code.length) {
    return { valid: false, error: "Código incompleto. Copie o código inteiro no app do banco." };
  }
  if (crc16(code.slice(0, crcIndex + 4)) !== code.slice(crcIndex + 4).toUpperCase()) {
    return { valid: false, error: "Código com erro de digitação ou cortado. Copie de novo no app do banco." };
  }
  const fields = readFields(code);
  if (!fields || !fields["26"]) return { valid: false, error: "Código PIX em formato desconhecido." };
  const account = readFields(fields["26"]) || {};
  if (!/^br\.gov\.bcb\.pix$/i.test(account["00"] || "")) {
    return { valid: false, error: "Esse código não é de PIX." };
  }
  const amount = fields["54"] ? Math.round(Number(fields["54"]) * 100) : null;
  return {
    valid: true,
    code,
    amountCents: Number.isFinite(amount) ? amount : null,
    merchantName: fields["59"] || "",
    merchantCity: fields["60"] || "",
    dynamic: Boolean(account["25"])
  };
}

// Mensagem para a Letícia sobre o código colado (vazio = sem aviso).
export function describePixCode(raw, expectedCents) {
  const code = normalizePixCode(raw);
  if (!code) return { tone: "muted", message: "" };
  const parsed = parsePixCode(code);
  if (!parsed.valid) return { tone: "error", message: parsed.error };
  const money = (cents) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100).replace(/[  ]/g, " ");
  const who = parsed.merchantName ? ` para ${parsed.merchantName}` : "";
  if (parsed.amountCents == null) {
    return { tone: "warning", message: `Código válido${who}, mas sem valor fixo: o paciente digita o valor.` };
  }
  if (expectedCents != null && parsed.amountCents !== expectedCents) {
    return {
      tone: "error",
      message: `O código cobra ${money(parsed.amountCents)}, mas o preço cadastrado é ${money(expectedCents)}. Gere um novo código com o valor certo.`
    };
  }
  return { tone: "success", message: `Código válido${who} · cobra ${money(parsed.amountCents)}.` };
}

// O código só aparece para o paciente se for válido e cobrar o valor certo (ou não tiver valor fixo).
export function pixCodeForAmount(raw, amountCents) {
  const parsed = parsePixCode(raw);
  if (!parsed.valid) return null;
  if (parsed.amountCents != null && amountCents != null && parsed.amountCents !== amountCents) return null;
  return parsed.code;
}
