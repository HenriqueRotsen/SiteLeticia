"use client";

// Confirmações e avisos do sistema, no lugar de window.confirm / window.alert
// (que no app instalado do iPhone às vezes nem aparecem e destoam do visual).
//
// Uso:
//   const { confirm, alert } = useDialog();
//   if (!(await confirm({ title: "Cancelar consulta?", confirmLabel: "Cancelar consulta", tone: "danger" }))) return;
//   await alert({ title: "Não foi possível imprimir", message: "..." });

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info } from "lucide-react";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const open = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setDialog(options);
    });
  }, []);

  const close = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((options = {}) => open({ kind: "confirm", ...options }), [open]);
  const alert = useCallback((options = {}) => open({ kind: "alert", ...options }), [open]);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog ? <DialogView dialog={dialog} onClose={close} /> : null}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog precisa estar dentro de <DialogProvider>.");
  return ctx;
}

function DialogView({ dialog, onClose }) {
  const isConfirm = dialog.kind === "confirm";
  const danger = dialog.tone === "danger";
  const confirmRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") onClose(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const Icon = danger ? AlertTriangle : Info;
  const title = dialog.title || (isConfirm ? "Tem certeza?" : "Aviso");
  const confirmLabel = dialog.confirmLabel || (isConfirm ? "Confirmar" : "Entendi");
  const cancelLabel = dialog.cancelLabel || "Voltar";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="lc-fade-in absolute inset-0 bg-graphite/45 backdrop-blur-[2px]"
        onClick={() => onClose(false)}
        aria-label="Fechar"
        tabIndex={-1}
      />
      <div
        role={isConfirm ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="lc-dialog-title"
        aria-describedby={dialog.message ? "lc-dialog-message" : undefined}
        className="lc-dialog-in relative w-full max-w-sm rounded-2xl border border-olive-900/10 bg-porcelain p-5 shadow-soft sm:p-6"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              danger ? "bg-rose-100 text-rose-700" : "bg-olive-100 text-olive-800"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 id="lc-dialog-title" className="text-base font-semibold text-graphite">
              {title}
            </h2>
            {dialog.message ? (
              <p id="lc-dialog-message" className="mt-1.5 text-sm leading-relaxed text-graphite/70">
                {dialog.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isConfirm ? (
            <button
              type="button"
              onClick={() => onClose(false)}
              className="rounded-xl border border-olive-900/15 bg-white px-4 py-2.5 text-sm font-semibold text-graphite hover:bg-linen"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
              danger ? "bg-rose-700 hover:bg-rose-800" : "bg-olive-800 hover:bg-olive-900"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
