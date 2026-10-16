"use client";

import { useState } from "react";
import { site, whatsappLink } from "@/lib/marketing/content";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Agendamento de consulta",
    message: ""
  });
  const [sent, setSent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const body = [
      `Nome: ${form.name}`,
      `E-mail: ${form.email}`,
      `Telefone: ${form.phone}`,
      `Assunto: ${form.subject}`,
      "",
      form.message
    ].join("\n");

    window.open(whatsappLink(site.whatsapp, body), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Nome</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            className="w-full rounded-2xl border border-olive-900/10 bg-white/70 px-4 py-3 outline-none transition focus:border-olive-600"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">E-mail</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
            className="w-full rounded-2xl border border-olive-900/10 bg-white/70 px-4 py-3 outline-none transition focus:border-olive-600"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">WhatsApp</span>
        <input
          required
          value={form.phone}
          onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
          className="w-full rounded-2xl border border-olive-900/10 bg-white/70 px-4 py-3 outline-none transition focus:border-olive-600"
          placeholder="(31) 99999-9999"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Assunto</span>
        <select
          value={form.subject}
          onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
          className="w-full rounded-2xl border border-olive-900/10 bg-white/70 px-4 py-3 outline-none transition focus:border-olive-600"
        >
          <option>Agendamento de consulta</option>
          <option>Dúvidas sobre acompanhamento</option>
          <option>Parcerias e palestras</option>
          <option>Imprensa / acadêmico</option>
          <option>Outro</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Mensagem</span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
          className="w-full resize-none rounded-2xl border border-olive-900/10 bg-white/70 px-4 py-3 outline-none transition focus:border-olive-600"
          placeholder="Conte brevemente como posso ajudar."
        />
      </label>

      <button
        type="submit"
        className="interactive-lift w-full rounded-2xl bg-graphite px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-porcelain transition hover:bg-olive-800 sm:w-auto"
      >
        Enviar pelo WhatsApp
      </button>

      {sent ? (
        <p className="text-sm text-olive-800">
          Se o WhatsApp não abriu automaticamente,{" "}
          <a href={whatsappLink(site.whatsapp)} className="font-semibold underline">
            clique aqui
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}
