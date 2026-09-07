import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Entrar | Letícia Cunha"
};

export default function EntrarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-olive-900/10 bg-porcelain p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive-700 text-sm font-bold text-white">
            LC
          </div>
          <div>
            <p className="text-sm font-medium text-olive-700">Acesso</p>
            <h1 className="text-2xl font-semibold text-graphite">Entrar</h1>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
