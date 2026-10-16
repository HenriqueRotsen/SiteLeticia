import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "@/lib/constants";
import { site } from "@/lib/marketing/content";

export const legalMeta = {
  privacyVersion: PRIVACY_POLICY_VERSION,
  termsVersion: TERMS_VERSION,
  lastUpdated: "30 de agosto de 2026",
  controllerName: site.name,
  controllerRole: "Nutricionista responsável pelo tratamento de dados na plataforma",
  controllerCity: site.city,
  contactEmail: site.email,
  privacyContactLabel: "Privacidade e dados pessoais"
};

export const privacySections = [
  {
    id: "introducao",
    title: "1. Introdução",
    paragraphs: [
      "Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais na plataforma de acompanhamento nutricional de Letícia Cunha.",
      "O tratamento é realizado em conformidade com a Lei nº 13.709/2018 (LGPD) e normas aplicáveis à documentação e ao sigilo em serviços de saúde.",
      `Versão ${legalMeta.privacyVersion}. Última atualização: ${legalMeta.lastUpdated}.`
    ]
  },
  {
    id: "controlador",
    title: "2. Quem é o controlador",
    paragraphs: [
      `Controlador: ${legalMeta.controllerName}. ${legalMeta.controllerRole}.`,
      `Canal para exercício de direitos e dúvidas sobre privacidade: ${legalMeta.contactEmail}.`,
      "Em caso de solicitações sobre dados de saúde, pedimos que utilize o mesmo e-mail identificando-se com nome completo e, se possível, o e-mail cadastrado na plataforma."
    ]
  },
  {
    id: "dados",
    title: "3. Quais dados tratamos",
    list: [
      "Identificação e contato: nome, e-mail, telefone/WhatsApp, CPF e endereço (quando informado).",
      "Dados de saúde e acompanhamento: objetivo do tratamento, medidas corporais, plano alimentar, exames, fotos de evolução, anotações clínicas e interpretações registradas pela nutricionista.",
      "Dados de uso da plataforma: agendamentos, status de pagamento de consultas, preferências de conta e registros de consentimento.",
      "Dados técnicos de segurança: endereço IP, data/hora de acesso e eventos de auditoria (sem incluir conteúdo clínico detalhado nos logs)."
    ]
  },
  {
    id: "finalidades",
    title: "4. Finalidades e bases legais",
    paragraphs: [
      "Tratamos seus dados para prestar o serviço de acompanhamento nutricional, agendar consultas, manter prontuário digital, comunicar sobre atendimentos e registrar sua evolução.",
      "Bases legais utilizadas, conforme a LGPD:"
    ],
    list: [
      "Consentimento: cadastro na plataforma, tratamento de dados de saúde e envio de fotos/exames.",
      "Execução de contrato ou procedimentos preliminares: agendamento e entrega do serviço contratado.",
      "Legítimo interesse: segurança da plataforma, prevenção a fraudes e registros de auditoria, sempre com medidas de minimização.",
      "Cumprimento de obrigação legal ou regulatória: quando exigido por norma aplicável à documentação profissional."
    ]
  },
  {
    id: "sensiveis",
    title: "5. Dados sensíveis de saúde",
    paragraphs: [
      "Informações sobre dieta, exames, composição corporal e condições clínicas são dados pessoais sensíveis. Elas só são tratadas com seu consentimento específico, obtido no cadastro e renovado quando esta política for atualizada de forma relevante.",
      "O acesso a prontuário, exames e fotos é restrito: pacientes visualizam apenas os próprios dados; a nutricionista responsável acessa os dados necessários ao atendimento."
    ]
  },
  {
    id: "compartilhamento",
    title: "6. Compartilhamento e operadores",
    paragraphs: [
      "Não vendemos seus dados. Compartilhamos informações apenas quando necessário para operar a plataforma ou cumprir a lei."
    ],
    list: [
      "Supabase (hospedagem de banco de dados, autenticação e armazenamento de arquivos): infraestrutura contratada com controles de segurança e criptografia em trânsito.",
      "Google Calendar (opcional, apenas da nutricionista): integração para gestão de agenda; tokens de acesso são armazenados de forma criptografada.",
      "APIs de alimentos (TACO, bases públicas e, quando habilitadas, FatSecret/USDA): consultas sobre alimentos; não enviamos seu prontuário completo a esses serviços.",
      "Autoridades públicas: somente mediante obrigação legal ou ordem válida."
    ]
  },
  {
    id: "seguranca",
    title: "7. Segurança da informação",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais proporcionais ao risco, incluindo:"
    ],
    list: [
      "Autenticação por senha e controle de acesso por perfil (paciente ou nutricionista).",
      "Row Level Security (RLS) no banco de dados, impedindo acesso cruzado entre pacientes.",
      "CPF armazenado com hash adicional e exibição mascarada na interface do paciente.",
      "Criptografia de tokens sensíveis, validação de entradas, limites de taxa em login e APIs críticas.",
      "Cabeçalhos de segurança HTTP (HSTS, CSP, proteção contra clickjacking e MIME sniffing).",
      "Registros de auditoria para ações relevantes, como alterações de perfil e prontuário."
    ],
    after: [
      "Nenhum sistema é 100% isento de riscos. Em caso de incidente de segurança com impacto relevante aos titulares, adotaremos medidas de contenção e comunicação conforme a LGPD."
    ]
  },
  {
    id: "retencao",
    title: "8. Prazo de retenção",
    list: [
      "Dados de conta e prontuário: mantidos enquanto durar o acompanhamento e pelo prazo necessário ao cumprimento de obrigações legais e exercício regular de direitos.",
      "Registros de consentimento: mantidos para comprovar a base legal do tratamento.",
      "Logs de auditoria e segurança: recomendado por 12 meses, salvo necessidade de retenção maior por investigação ou obrigação legal.",
      "Após solicitação de exclusão ou término do vínculo, dados poderão ser anonimizados ou eliminados, ressalvadas retenções legais."
    ]
  },
  {
    id: "direitos",
    title: "9. Seus direitos (LGPD)",
    paragraphs: ["Você pode, a qualquer momento, solicitar:"],
    list: [
      "Confirmação da existência de tratamento e acesso aos dados.",
      "Correção de dados incompletos, inexatos ou desatualizados.",
      "Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.",
      "Portabilidade, quando aplicável.",
      "Informação sobre compartilhamentos.",
      "Revogação do consentimento, com efeitos para tratamentos futuros que dependam dele.",
      "Revisão de decisões automatizadas, quando houver."
    ],
    after: [
      `Envie pedidos para ${legalMeta.contactEmail}. Responderemos em prazo razoável, conforme a LGPD. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).`
    ]
  },
  {
    id: "cookies",
    title: "10. Cookies e tecnologias similares",
    paragraphs: [
      "Utilizamos cookies estritamente necessários para manter sua sessão autenticada e garantir o funcionamento seguro da plataforma.",
      "Não utilizamos cookies de publicidade comportamental nesta versão da plataforma."
    ]
  },
  {
    id: "alteracoes",
    title: "11. Alterações desta política",
    paragraphs: [
      "Podemos atualizar esta política para refletir mudanças legais ou no serviço. A versão vigente estará sempre nesta página, com data de revisão.",
      "Mudanças relevantes poderão exigir novo consentimento ou aviso destacado no login ou cadastro."
    ]
  }
];

export const termsSections = [
  {
    id: "aceitacao",
    title: "1. Aceitação dos termos",
    paragraphs: [
      `Estes Termos de Uso regem o acesso e a utilização da plataforma de acompanhamento nutricional de ${legalMeta.controllerName}.`,
      `Versão ${legalMeta.termsVersion}. Última atualização: ${legalMeta.lastUpdated}.`,
      "Ao criar conta, acessar a área do paciente ou utilizar funcionalidades do sistema, você declara ter lido e concordado com estes Termos e com a Política de Privacidade."
    ]
  },
  {
    id: "servico",
    title: "2. Objeto do serviço",
    paragraphs: [
      "A plataforma permite acompanhamento nutricional digital entre paciente e nutricionista, incluindo consulta de plano alimentar, envio de exames e fotos, agendamento de consultas e acompanhamento de evolução.",
      "O serviço complementa o atendimento profissional; não substitui avaliação presencial, urgência ou emergência médica."
    ]
  },
  {
    id: "conta",
    title: "3. Cadastro e responsabilidades da conta",
    list: [
      "Você deve fornecer informações verdadeiras, completas e atualizadas.",
      "É sua responsabilidade manter a confidencialidade da senha e notificar imediatamente uso não autorizado.",
      "Cada conta é pessoal e intransferível.",
      "Menores de 18 anos só devem utilizar a plataforma com consentimento e supervisão do responsável legal, quando aplicável."
    ]
  },
  {
    id: "uso",
    title: "4. Uso adequado",
    paragraphs: ["É proibido:"],
    list: [
      "Tentar acessar dados de outros usuários ou áreas restritas da nutricionista.",
      "Enviar conteúdo ilícito, ofensivo ou que viole direitos de terceiros.",
      "Utilizar a plataforma para fins diferentes do acompanhamento nutricional autorizado.",
      "Contornar medidas de segurança, realizar engenharia reversa ou sobrecarregar o sistema de forma abusiva."
    ]
  },
  {
    id: "saude",
    title: "5. Conteúdo de saúde e limitações",
    paragraphs: [
      "Orientações, planos alimentares e interpretações assistidas de exames têm caráter profissional, mas dependem das informações fornecidas por você e da avaliação clínica.",
      "A plataforma não deve ser usada para emergências. Em caso de risco à vida ou agravamento súbito, procure imediatamente serviço de urgência ou contato médico.",
      "Decisões clínicas finais são de responsabilidade da nutricionista e do paciente, considerando o contexto individual."
    ]
  },
  {
    id: "propriedade",
    title: "6. Propriedade intelectual",
    paragraphs: [
      "A marca, layout, software e materiais produzidos pela nutricionista na plataforma são protegidos por direito de autor e demais normas aplicáveis.",
      "Você mantém a titularidade sobre os conteúdos que envia (exames, fotos, informações), concedendo licença necessária para armazenamento e tratamento no âmbito do serviço."
    ]
  },
  {
    id: "privacidade",
    title: "7. Privacidade e proteção de dados",
    paragraphs: [
      "O tratamento de dados pessoais e sensíveis segue a Política de Privacidade, parte integrante destes Termos.",
      "Ao aceitar os Termos no cadastro, você também autoriza o tratamento de dados de saúde conforme descrito na política vigente."
    ]
  },
  {
    id: "disponibilidade",
    title: "8. Disponibilidade e alterações do serviço",
    paragraphs: [
      "Buscamos alta disponibilidade, mas manutenções, falhas de terceiros ou força maior podem causar interrupções temporárias.",
      "Funcionalidades podem ser ajustadas, incluídas ou descontinuadas, preservando-se direitos já adquiridos em serviços contratados quando aplicável."
    ]
  },
  {
    id: "responsabilidade",
    title: "9. Limitação de responsabilidade",
    paragraphs: [
      "Na extensão permitida pela lei, a plataforma não se responsabiliza por danos decorrentes de uso inadequado, informações incorretas fornecidas pelo usuário ou indisponibilidade temporária fora de nosso controle razoável.",
      "Nada nestes Termos limita direitos irrenunciáveis do consumidor ou responsabilidades previstas em lei."
    ]
  },
  {
    id: "alteracoes-termos",
    title: "10. Alterações dos termos",
    paragraphs: [
      "Estes Termos podem ser atualizados. A versão publicada nesta página prevalece.",
      "O uso continuado após alterações relevantes poderá exigir nova aceitação."
    ]
  },
  {
    id: "foro",
    title: "11. Lei aplicável e contato",
    paragraphs: [
      "Estes Termos são regidos pelas leis da República Federativa do Brasil.",
      "Fica eleito o foro da comarca de Belo Horizonte/MG para dirimir controvérsias, salvo disposição legal em contrário aplicável ao consumidor.",
      `Dúvidas sobre estes Termos: ${legalMeta.contactEmail}.`
    ]
  }
];
