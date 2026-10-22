import { Suspense } from "react";
import Link from "next/link";
import { LcMonogram } from "@/components/brand/BrandMark";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Criar conta | Letícia Cunha"
};

export default function CriarContaPage() {
  return (
    <main className="flex min-h-dvh items-start justify-center overflow-y-auto bg-linen px-4 py-4 sm:items-center sm:px-5 sm:py-6">
      <section className="my-auto w-full max-w-md rounded-2xl border border-olive-900/10 bg-porcelain p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linen ring-1 ring-olive-900/10">
            <LcMonogram className="h-8 w-auto" alt="" />
          </div>
          <div>
            <p className="text-sm font-medium text-olive-700">Cadastro</p>
            <h1 className="font-display text-xl text-graphite sm:text-2xl">Crie sua conta</h1>
          </div>
        </div>
        <p className="mb-3 text-sm leading-5 text-graphite/60">
          Acesse dieta, exames e evolução. Ao cadastrar, você também entra na fila de prioridade.
        </p>
        <p className="mb-4 text-sm text-graphite/55">
          Só quer reservar lugar?{" "}
          <Link href="/fila-de-espera" className="font-semibold text-olive-700 hover:text-olive-800">
            Entrar na lista de espera
          </Link>
        </p>
        <Suspense>
          <SignupForm />
        </Suspense>
      </section>
    </main>
  );
}
