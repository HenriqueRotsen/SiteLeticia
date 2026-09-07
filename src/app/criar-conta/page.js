import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Criar conta | Letícia Cunha"
};

export default function CriarContaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-olive-900/10 bg-porcelain p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive-700 text-sm font-bold text-white">
            LC
          </div>
          <div>
            <p className="text-sm font-medium text-olive-700">Cadastro</p>
            <h1 className="text-2xl font-semibold text-graphite">Crie sua conta</h1>
          </div>
        </div>
        <p className="mb-6 text-sm leading-6 text-graphite/60">
          Crie sua conta para acessar dieta, exames e evolução. Ao se cadastrar, você também entra na fila de prioridade
          mantendo a ordem de quem já estava aguardando.
        </p>
        <p className="mb-6 text-sm text-graphite/55">
          Só quer reservar lugar na fila por enquanto?{" "}
          <Link href="/fila-de-espera" className="font-semibold text-olive-700 hover:text-olive-800">
            Entrar na lista de espera
          </Link>
        </p>
        <SignupForm />
      </section>
    </main>
  );
}
