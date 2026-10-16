import { Suspense } from "react";
import VerifyCodeForm from "@/components/auth/VerifyCodeForm";

export const metadata = {
  title: "Verificar código | Letícia Cunha"
};

export default function VerificarCodigoPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-linen px-4 py-6">
      <section className="w-full max-w-md rounded-2xl border border-olive-900/10 bg-porcelain p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive-700 text-sm font-bold text-white">
            LC
          </div>
          <div>
            <p className="text-sm font-medium text-olive-700">Segurança</p>
            <h1 className="text-2xl font-semibold text-graphite">Verificar código</h1>
          </div>
        </div>
        <Suspense>
          <VerifyCodeForm />
        </Suspense>
      </section>
    </main>
  );
}
