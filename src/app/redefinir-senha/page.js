import { redirect } from "next/navigation";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo/config";

export const metadata = {
  title: "Redefinir senha | Letícia Cunha"
};

export default async function RedefinirSenhaPage() {
  if (!isDemoMode()) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/recuperar-senha?error=link_expirado");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-olive-900/10 bg-porcelain p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive-700 text-sm font-bold text-white">
            LC
          </div>
          <div>
            <p className="text-sm font-medium text-olive-700">Acesso</p>
            <h1 className="text-2xl font-semibold text-graphite">Nova senha</h1>
          </div>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
