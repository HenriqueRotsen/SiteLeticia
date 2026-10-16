export function flagLabelPt(flag) {
  if (flag === "high") return "Acima";
  if (flag === "low") return "Abaixo";
  if (flag === "normal") return "Normal";
  return "Sem classificação";
}

export function isExamDone(exam) {
  return exam?.status === "done" && Boolean(exam?.result);
}

export function countExamProgress(orders = []) {
  const exams = orders.flatMap((order) => order.exams || []);
  const done = exams.filter((exam) => isExamDone(exam)).length;
  return { total: exams.length, done, pending: Math.max(exams.length - done, 0) };
}
