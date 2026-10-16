import { Suspense } from "react";
import DemoPageClient from "./DemoPageClient";

export const metadata = {
  title: "Modo demo | Letícia Cunha"
};

export default function DemoPage() {
  return (
    <Suspense fallback={<main className="px-5 py-16 text-center text-sm">Carregando demo...</main>}>
      <DemoPageClient />
    </Suspense>
  );
}
