"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

function formatWhen(iso) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min atrás`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} h atrás`;

  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (active) setNotifications(data.notifications || []);
      })
      .catch(() => {
        if (active) setNotifications([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-olive-900/10 bg-white text-graphite/60 transition hover:bg-linen"
        aria-label="Notificações"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-olive-900/10 bg-porcelain shadow-soft"
        >
          <div className="border-b border-olive-900/10 px-4 py-3">
            <p className="font-semibold text-graphite">Notificações</p>
            <p className="text-xs text-graphite/45">
              {unreadCount
                ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                : "Tudo em dia"}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-graphite/45">Carregando...</p>
            ) : notifications.length ? (
              <ul className="divide-y divide-olive-900/5">
                {notifications.map((item) => {
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-graphite">{item.title}</p>
                        {item.unread ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-olive-600" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-5 text-graphite/60">{item.body}</p>
                      <p className="mt-2 text-xs text-graphite/40">{formatWhen(item.createdAt)}</p>
                    </>
                  );

                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="block px-4 py-3 transition hover:bg-linen/80"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="px-4 py-3">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-graphite">Nenhum aviso</p>
                <p className="mt-1 text-sm text-graphite/45">Você será avisado aqui quando houver novidades.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
