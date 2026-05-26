"use client";

import { useEffect, useMemo, useState } from "react";

const initialLogin = {
  username: "",
  password: ""
};

function formatPhone(phone) {
  if (!phone) return "-";
  if (phone.length <= 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }

  return phone.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const [login, setLogin] = useState(initialLogin);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const stats = useMemo(() => {
    const waiting = waitlist.filter((item) => item.status === "waiting").length;
    const called = waitlist.filter((item) => item.status === "called").length;

    return {
      total: waitlist.length,
      waiting,
      called
    };
  }, [waitlist]);

  async function loadWaitlist() {
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/admin/waitlist");

    if (response.status === 401) {
      setIsAuthenticated(false);
      setWaitlist([]);
      setLoading(false);
      return;
    }

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(result.message || "Não foi possível carregar os dados.");
      return;
    }

    setIsAuthenticated(true);
    setWaitlist(result.waitlist || []);
  }

  useEffect(() => {
    loadWaitlist();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login)
    });
    const result = await response.json();

    if (!response.ok) {
      setLoading(false);
      setFeedback(result.message || "Não foi possível entrar.");
      return;
    }

    setLogin(initialLogin);
    await loadWaitlist();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setWaitlist([]);
  }

  async function updateStatus(id, status) {
    setSavingId(id);
    setFeedback("");

    const response = await fetch("/api/admin/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const result = await response.json();
    setSavingId(null);

    if (!response.ok) {
      setFeedback(result.message || "Não foi possível atualizar.");
      return;
    }

    setWaitlist((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  async function removePatient(id) {
    const confirmed = window.confirm("Remover este cadastro da lista?");
    if (!confirmed) return;

    setSavingId(id);
    setFeedback("");

    const response = await fetch(`/api/admin/waitlist?id=${id}`, {
      method: "DELETE"
    });
    const result = await response.json();
    setSavingId(null);

    if (!response.ok) {
      setFeedback(result.message || "Não foi possível remover.");
      return;
    }

    setWaitlist((current) => current.filter((item) => item.id !== id));
  }

  function getWaitingPosition(id) {
    return waitlist.filter((item) => item.status === "waiting" && item.id <= id).length;
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <section className="w-full max-w-md rounded-[1.75rem] border border-white/80 bg-porcelain/95 p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive-700">
            Área restrita
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-graphite">
            Dashboard da lista
          </h1>
          <p className="mt-3 text-sm leading-6 text-graphite/68">
            Acesse com o usuário e senha definidos para a Letícia.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-graphite" htmlFor="username">
                Usuário
              </label>
              <input
                id="username"
                value={login.username}
                onChange={(event) =>
                  setLogin((current) => ({ ...current, username: event.target.value }))
                }
                className="w-full rounded-2xl border border-olive-900/10 bg-white px-4 py-3 text-graphite outline-none transition focus:border-olive-600 focus:ring-4 focus:ring-olive-200"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-graphite" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={login.password}
                onChange={(event) =>
                  setLogin((current) => ({ ...current, password: event.target.value }))
                }
                className="w-full rounded-2xl border border-olive-900/10 bg-white px-4 py-3 text-graphite outline-none transition focus:border-olive-600 focus:ring-4 focus:ring-olive-200"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-olive-700 px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-olive-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>

          {feedback ? (
            <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-900">
              {feedback}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-olive-900/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive-700">
              Área restrita
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-graphite sm:text-4xl">
              Dashboard da lista de espera
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadWaitlist}
              className="rounded-2xl border border-olive-700/25 px-4 py-3 text-sm font-semibold text-graphite transition hover:bg-white/60"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl bg-graphite px-4 py-3 text-sm font-semibold text-white transition hover:bg-olive-900"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/70 p-5">
            <p className="text-sm font-semibold text-graphite/60">Total</p>
            <p className="mt-2 text-4xl font-semibold text-graphite">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-olive-50 p-5">
            <p className="text-sm font-semibold text-olive-900/70">Aguardando</p>
            <p className="mt-2 text-4xl font-semibold text-olive-900">{stats.waiting}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-5">
            <p className="text-sm font-semibold text-graphite/60">Chamados</p>
            <p className="mt-2 text-4xl font-semibold text-graphite">{stats.called}</p>
          </div>
        </div>

        {feedback ? (
          <p className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-900">
            {feedback}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-olive-900/10 bg-porcelain/95 shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-linen text-xs uppercase tracking-[0.14em] text-graphite/60">
                <tr>
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Paciente</th>
                  <th className="px-5 py-4">WhatsApp</th>
                  <th className="px-5 py-4">Objetivo</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Cadastro</th>
                  <th className="px-5 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-900/10">
                {loading ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-graphite/60" colSpan="7">
                      Carregando lista...
                    </td>
                  </tr>
                ) : null}

                {!loading && waitlist.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-graphite/60" colSpan="7">
                      Nenhum cadastro encontrado.
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? waitlist.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-5 py-4 font-semibold text-graphite">
                          {item.status === "waiting" ? getWaitingPosition(item.id) : "-"}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-graphite">{item.full_name}</p>
                        </td>
                        <td className="px-5 py-4 text-graphite/72">
                          {formatPhone(item.phone)}
                        </td>
                        <td className="px-5 py-4 text-graphite/72">{item.goal}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === "waiting"
                                ? "bg-olive-100 text-olive-900"
                                : "bg-graphite text-white"
                            }`}
                          >
                            {item.status === "waiting" ? "Aguardando" : "Chamado"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-graphite/60">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-52 flex-wrap gap-2">
                            {item.status === "waiting" ? (
                              <button
                                type="button"
                                disabled={savingId === item.id}
                                onClick={() => updateStatus(item.id, "called")}
                                className="rounded-xl bg-olive-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-olive-800 disabled:opacity-50"
                              >
                                Marcar atendida
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={savingId === item.id}
                                onClick={() => updateStatus(item.id, "waiting")}
                                className="rounded-xl border border-olive-700/25 px-3 py-2 text-xs font-semibold text-graphite transition hover:bg-white disabled:opacity-50"
                              >
                                Voltar para fila
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={savingId === item.id}
                              onClick={() => removePatient(item.id)}
                              className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
