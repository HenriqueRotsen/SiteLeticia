// Sem dependências de servidor: usado também no navegador.

/** Mensagem curta para a interface. */
export function describeSyncResult(body) {
  if (!body) return "Não foi possível buscar as atas.";
  if (body.message) return body.message;
  const imported = body.imported || 0;
  const pending = body.pending || 0;
  const parts = [];
  parts.push(
    imported === 0
      ? "Nenhuma ata nova encontrada."
      : imported === 1
        ? "1 ata importada como rascunho."
        : `${imported} atas importadas como rascunho.`
  );
  if (pending) {
    parts.push(
      pending === 1
        ? "1 consulta encerrada ainda sem ata no Google Agenda."
        : `${pending} consultas encerradas ainda sem ata no Google Agenda.`
    );
  }
  if (body.failures?.length) parts.push(`${body.failures.length} com erro.`);
  return parts.join(" ");
}
