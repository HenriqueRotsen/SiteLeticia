export const site = {
  name: "Letícia Cunha",
  role: "Nutricionista clínica",
  domain: "Saúde & Nutrição",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "leticiavrcunha@gmail.com",
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "5531995244214",
  instagram: process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM || "leticiavrcunha",
  city: "Belo Horizonte, MG"
};

export const navLinks = [
  { href: "/", label: "Início" },
  { href: "/sobre/formacao", label: "Formação" },
  { href: "/sobre/pesquisas", label: "Pesquisas" },
  { href: "/contato", label: "Contato" }
];

export const credentials = [
  { label: "Formada em Enfermagem (UFMG)", detail: "Base clínica para leitura de sinais, exames e cuidado integral." },
  { label: "Graduanda em Nutrição", detail: "Formação contínua em ciências dos alimentos e conduta nutricional." },
  { label: "Mestranda em Nutrição e Saúde (UFMG)", detail: "Linha Nutrição Clínica e Experimental, orientação Profª Luciana Bastos Rodrigues." }
];

/** Destaques compactos do hero (ao lado da história bariátrica). */
export const heroHighlights = [
  {
    value: "−50 kg",
    label: "Perdeu após bariátrica em 2022"
  },
  {
    value: "Mestrado",
    label: "Nutrição clínica · UFMG"
  },
  {
    value: "Enfermeira e nutricionista",
    label: "Dupla formação"
  },
  {
    value: "+7 artigos",
    label: "Publicações científicas"
  }
];

export const specialties = [
  {
    title: "Bariátrica",
    text: "Reabilitação nutricional antes e depois da cirurgia, com foco em adesão e qualidade de vida."
  },
  {
    title: "Nutrição clínica",
    text: "Planos individualizados para condições metabólicas, inflamatórias e funcionais."
  },
  {
    title: "Nutrição de precisão",
    text: "Integração de história clínica, exames e objetivos para condutas mais assertivas."
  },
  {
    title: "Saúde intestinal",
    text: "Estratégias alimentares para conforto digestivo, microbiota e sintomas gastrointestinais."
  }
];

export const pillars = [
  {
    number: "01",
    title: "Ciência aplicada",
    text: "Evidências traduzidas em escolhas possíveis, sem rigidez desnecessária."
  },
  {
    number: "02",
    title: "Olhar individual",
    text: "Cada plano considera história, sintomas, rotina, preferências e objetivos."
  },
  {
    number: "03",
    title: "Experiência vivida",
    text: "Após perder 50 kg pós-bariátrica em 2022, Letícia combina vivência e formação técnica."
  }
];

export const formationTimeline = [
  {
    period: "Concluído",
    title: "Enfermagem",
    institution: "Graduação",
    description:
      "Formação que sustenta a leitura clínica, o acolhimento e a integração entre cuidado humano e protocolo."
  },
  {
    period: "Em curso",
    title: "Nutrição",
    institution: "Graduação",
    description:
      "Aprofundamento em fisiologia, bioquímica nutricional, dietoterapia e educação alimentar baseada em evidências."
  },
  {
    period: "Em curso",
    title: "Mestrado em Nutrição e Saúde",
    institution: "Universidade Federal de Minas Gerais (UFMG)",
    description:
      "Linha de pesquisa Nutrição Clínica e Experimental, sob orientação da Profª Luciana Bastos Rodrigues. Admissão em 2025/1."
  }
];

export const formationHighlights = [
  "Integração entre enfermagem clínica e nutrição aplicada",
  "Leitura crítica de literatura científica",
  "Comunicação clara com pacientes e equipe multiprofissional",
  "Condutas individualizadas para diferentes perfis metabólicos"
];

export const lattes = {
  id: "K9772382J8",
  url: "https://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K9772382J8"
};

export const researchProfile = {
  fullName: "Letícia Cunha",
  program: "Mestrado Profissional — Pós-Graduação em Nutrição e Saúde",
  institution: "Universidade Federal de Minas Gerais (UFMG)",
  researchLine: "Nutrição Clínica e Experimental",
  advisor: "Profª Luciana Bastos Rodrigues",
  advisorLine:
    "Genética, bioquímica e biologia molecular aplicadas à nutrição clínica, com ênfase em medicina de precisão.",
  admission: "2025/1",
  expectedCompletion: "Março/2027"
};

export const researchAreas = [
  {
    tag: "Nutrição clínica",
    title: "Terapia nutricional individualizada",
    description:
      "Estudo de condutas nutricionais baseadas em diretrizes, fenótipo clínico e tomada de decisão compartilhada, especialmente em situações complexas."
  },
  {
    tag: "Bariátrica",
    title: "Nutrição bariátrica",
    description:
      "Acompanhamento nutricional antes e depois da cirurgia, com foco em adesão, prevenção de deficiências e manutenção de resultados a longo prazo."
  },
  {
    tag: "Cuidados paliativos",
    title: "Suporte nutricional em oncologia e paliatividade",
    description:
      "Reflexão sobre indicação de terapia nutricional enteral ou parenteral, qualidade de vida e decisões éticas centradas no paciente."
  },
  {
    tag: "Precisão & metabolismo",
    title: "Nutrição de precisão e reabilitação metabólica",
    description:
      "Interesse em biomarcadores, variabilidade metabólica e reabilitação nutricional, com foco em bariátrica e manutenção de resultados."
  }
];

export const researchArticles = [
  {
    type: "Artigo",
    title:
      "Atuação do Nutricionista e o Método Canguru no Cuidado Materno-Infantil: Revisão Narrativa",
    journal: "Revista ARACÊ",
    year: "2026",
    issue: "v. 8, n. 5",
    doi: "10.56238/arev8n5-047",
    url: "https://periodicos.newsciencepubl.com/arace/article/view/13112",
    topics: ["Materno-infantil", "Amamentação", "Método Canguru"],
    description:
      "Revisão narrativa de 25 estudos (Embase, Scopus e PubMed) sobre como a integração de ações nutricionais ao Método Canguru reforça humanização, equidade e integralidade no cuidado materno-infantil."
  },
  {
    type: "Artigo",
    title:
      "Temos tempo e espaço para tomada de decisão (TDec) na terapia nutricional enteral ou parenteral (TNEP) em pacientes em cuidados paliativos?",
    journal: "Revista ARACÊ",
    year: "2026",
    issue: "v. 8, n. 5",
    doi: "10.56238/arev8n5-035",
    url: "https://periodicos.newsciencepubl.com/arace/article/view/13072",
    topics: ["Cuidados paliativos", "Terapia nutricional", "Nutrição oncológica"],
    description:
      "Análise de diretrizes internacionais (ESPEN, INCA) e nacionais (BRASPEN, Consenso de Nutrição Oncológica) sobre critérios para prescrição de TNEP em cuidados paliativos e tomada de decisão ética."
  }
];

export const researchFocus = [
  {
    title: "Projeto de mestrado (UFMG)",
    period: "2025–2027",
    description:
      "Investigação na linha de Nutrição Clínica e Experimental, com orientação da Profª Luciana Bastos Rodrigues, integrando ciência básica e aplicação clínica."
  },
  {
    title: "Medicina de precisão aplicada à nutrição",
    description:
      "Interesse em genética, bioquímica e biologia molecular como suporte à conduta nutricional individualizada, eixo central da linha de pesquisa da orientadora."
  },
  {
    title: "Tradução de evidência para a consulta",
    description:
      "Compromisso em transformar revisões sistemáticas, diretrizes e achados científicos em orientações práticas e acolhedoras para pacientes."
  }
];

export const researchPrinciples = [
  "Condutas nutricionais fundamentadas em diretrizes e evidências científicas",
  "Tomada de decisão compartilhada, respeitando contexto clínico e expectativas do paciente",
  "Integração entre avaliação nutricional, exames e sintomas reais",
  "Comunicação clara e acolhedora na tradução da ciência para o dia a dia"
];

export const contactReasons = [
  "Agendamento de consulta ou retorno",
  "Dúvidas sobre acompanhamento nutricional",
  "Parcerias e convites para palestras",
  "Imprensa e oportunidades acadêmicas"
];

export function whatsappLink(phone, message = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function formatWhatsappDisplay(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  let country = "";
  let local = digits;
  if (digits.startsWith("55") && digits.length >= 12) {
    country = "+55 ";
    local = digits.slice(2);
  }

  if (local.length <= 2) return `${country}${local}`.trim();
  if (local.length <= 7) return `${country}(${local.slice(0, 2)}) ${local.slice(2)}`.trim();
  return `${country}(${local.slice(0, 2)}) ${local.slice(2, local.length - 4)}-${local.slice(-4)}`.trim();
}

export function instagramLink(handle) {
  const clean = String(handle || "").replace(/^@/, "");
  return `https://instagram.com/${clean}`;
}
