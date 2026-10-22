import { Suspense } from "react";
import { LcMonogram } from "@/components/brand/BrandMark";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Entrar | Letícia Cunha"
};

export default function EntrarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-olive-900/10 bg-porcelain p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linen ring-1 ring-olive-900/10">
            <LcMonogram className="h-9 w-auto" alt="" />
          </div>
          <div>
            <p className="text-sm font-medium text-olive-700">Acesso</p>
            <h1 className="font-display text-2xl text-graphite">Entrar</h1>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
