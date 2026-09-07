"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, size = "lg" }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const maxWidth =
    size === "lg" ? "max-w-3xl" : size === "sm" ? "max-w-md" : "max-w-lg";
  const showHeader = Boolean(title);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-graphite/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={showHeader ? "modal-title" : undefined}
        className={`relative w-full ${maxWidth} max-h-[min(90dvh,900px)] overflow-y-auto rounded-2xl border border-olive-900/10 bg-porcelain shadow-soft`}
      >
        {showHeader ? (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-olive-900/10 bg-porcelain/95 px-5 py-4 backdrop-blur-sm">
            <h2 id="modal-title" className="text-lg font-semibold text-graphite">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-graphite/50 hover:bg-linen hover:text-graphite"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-graphite/40 transition hover:bg-linen hover:text-graphite"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
