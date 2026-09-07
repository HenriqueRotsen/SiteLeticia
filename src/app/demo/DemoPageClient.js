"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { isPublicDemoMode } from "@/lib/demo/config-public";

export default function DemoPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  async function enterAs(role) {
    await fetch("/api/demo/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });

    if (role === "nutritionist") {
      router.push(next.startsWith("/admin") ? next : "/admin");
      return;
    }

    router.push(next.startsWith("/app") ? next : "/app");
  }

  if (!isPublicDemoMode()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linen px-5 py-16">
        <section className="w-full max-w-lg rounded-2xl border border-olive-900/10 bg-porcelain p-8 text-center shadow-card">
          <h1 className="text-2xl font-semibold text-graphite">Modo demo desativado</h1>
          <p className="mt-3 text-sm leading-6 text-graphite/60">
            Copie <code className="rounded bg-linen px-1.5 py-0.5">.env.demo</code> para{" "}
            <code className="rounded bg-linen px-1.5 py-0.5">.env.local</code> e rode{" "}
            <code className="rounded bg-linen px-1.5 py-0.5">npm run dev:demo</code>.
          </p>
          <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-olive-700 hover:text-olive-800">
            Voltar ao site
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-5 py-10">
      <section className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-700 text-lg font-bold text-white shadow-sm">
            LC
          </div>
          <p className="text-sm font-medium text-olive-700">Modo demonstração</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-graphite">Testar sem Supabase</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-graphite/60">
            Explore layout e fluxos com dados fictícios. Nada é salvo no banco — ideal para validar a experiência
            antes de configurar login e Supabase.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => enterAs("patient")}
            className="group rounded-2xl border border-olive-900/10 bg-porcelain p-6 text-left shadow-card transition hover:border-olive-300 hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
              <UserRound className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-graphite">Entrar como paciente</h2>
            <p className="mt-2 text-sm leading-6 text-graphite/60">
              Dieta, exames, agenda, consultas e evolução com dados de exemplo.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-olive-700 group-hover:gap-2 transition-all">
              Acessar portal <ArrowRight className="h-4 w-4" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => enterAs("nutritionist")}
            className="group rounded-2xl border border-olive-900/10 bg-porcelain p-6 text-left shadow-card transition hover:border-olive-300 hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive-50 text-olive-700">
              <Stethoscope className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-graphite">Entrar como Letícia</h2>
            <p className="mt-2 text-sm leading-6 text-graphite/60">
              Dashboard, pacientes, agenda, pagamento e integrações em modo admin.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-olive-700 group-hover:gap-2 transition-all">
              Acessar admin <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm text-amber-950">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Ambiente local de demonstração. Alterações são temporárias e somem ao reiniciar o servidor.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-medium text-graphite/45 transition hover:text-graphite/70"
        >
          Voltar à landing
        </Link>
      </section>
    </main>
  );
}
