export function getDemoNotifications(role) {
  const now = Date.now();

  if (role === "nutritionist") {
    return [
      {
        id: "n-admin-1",
        title: "Consulta hoje às 14h",
        body: "Maria Demo Silva — pagamento ainda pendente.",
        href: "/admin/consultas",
        createdAt: new Date(now - 1000 * 60 * 25).toISOString(),
        unread: true
      },
      {
        id: "n-admin-2",
        title: "Exame aguardando revisão",
        body: "PDF de hemograma enviado pela paciente demo.",
        href: "/admin/exames",
        createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        unread: true
      },
      {
        id: "n-admin-3",
        title: "Google Calendar desconectado",
        body: "Conecte para gerar links do Meet automaticamente.",
        href: "/admin/configuracoes/integracoes",
        createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
        unread: false
      }
    ];
  }

  return [
    {
      id: "n-patient-1",
      title: "Consulta confirmada",
      body: "Sua próxima sessão com a Letícia está agendada.",
      href: "/app/consultas",
      createdAt: new Date(now - 1000 * 60 * 40).toISOString(),
      unread: true
    },
    {
      id: "n-patient-2",
      title: "Pagamento pendente",
      body: "Envie o comprovante PIX para garantir o horário.",
      href: "/app/consultas",
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      unread: true
    },
    {
      id: "n-patient-3",
      title: "Novo insight disponível",
      body: "Confira a recomendação da semana na sua evolução.",
      href: "/app/evolucao",
      createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
      unread: false
    }
  ];
}
