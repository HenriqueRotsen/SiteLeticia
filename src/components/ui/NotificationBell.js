"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarDays, CheckCheck, CreditCard, FlaskConical, Plug, TrendingUp, X } from "lucide-react";

const STORAGE_KEY = "lc-notifications-v1";
const DAY = 24 * 60 * 60 * 1000;
/** Avisos já lidos somem sozinhos depois disso; qualquer aviso some depois do máximo. */
const READ_TTL = 2 * DAY;
const MAX_AGE = 14 * DAY;
const INITIAL_VISIBLE = 5;

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      read: parsed.read && typeof parsed.read === "object" ? parsed.read : {},
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : []
    };
  } catch {
    return { read: {}, dismissed: [] };
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* sem armazenamento: o estado vale só nesta sessão */
  }
}

function formatWhen(iso) {
  const date = new Date(iso);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min atrás`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} h atrás`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function groupOf(iso) {
  const age = Date.now() - new Date(iso).getTime();
  if (age < DAY) return "Hoje";
  if (age < 2 * DAY) return "Ontem";
  return "Anteriores";
}

function iconFor(item) {
  const key = `${item.href || ""} ${item.title || ""}`.toLowerCase();
  if (key.includes("pagamento") || key.includes("financeiro")) return CreditCard;
  if (key.includes("exame")) return FlaskConical;
  if (key.includes("integra") || key.includes("calendar")) return Plug;
  if (key.includes("evolu")) return TrendingUp;
  if (key.includes("consulta") || key.includes("agenda")) return CalendarDays;
  return Bell;
}

export default function NotificationBell() {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({ read: {}, dismissed: [] });
  const [showAll, setShowAll] = useState(false);
  const [leaving, setLeaving] = useState([]);

  useEffect(() => {
    setState(loadState());
  }, []);

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
      if (!rootRef.current?.contains(event.target)) setOpen(false);
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

  const update = useCallback((updater) => {
    setState((current) => {
      const next = updater(current);
      saveState(next);
      return next;
    });
  }, []);

  /** Avisos que ainda valem: não dispensados e não vencidos (lidos somem mais cedo). */
  const items = useMemo(() => {
    const now = Date.now();
    return notifications
      .map((item) => {
        const readAt = state.read[item.id];
        const unread = Boolean(item.unread) && !readAt;
        return { ...item, unread, readAt };
      })
      .filter((item) => {
        if (state.dismissed.includes(item.id)) return false;
        const age = now - new Date(item.createdAt).getTime();
        if (age > MAX_AGE) return false;
        if (!item.unread && age > READ_TTL) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications, state]);

  const unreadCount = items.filter((item) => item.unread).length;
  const visible = showAll ? items : items.slice(0, INITIAL_VISIBLE);
  const hidden = items.length - visible.length;

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of visible) {
      const label = groupOf(item.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(item);
    }
    return [...map.entries()];
  }, [visible]);

  function markRead(id) {
    update((current) => ({ ...current, read: { ...current.read, [id]: Date.now() } }));
  }

  function markAllRead() {
    update((current) => {
      const read = { ...current.read };
      for (const item of items) read[item.id] = read[item.id] || Date.now();
      return { ...current, read };
    });
  }

  function dismiss(id) {
    setLeaving((list) => [...list, id]);
    window.setTimeout(() => {
      update((current) => ({ ...current, dismissed: [...current.dismissed, id] }));
      setLeaving((list) => list.filter((value) => value !== id));
    }, 220);
  }

  function clearAll() {
    update((current) => ({
      ...current,
      dismissed: [...new Set([...current.dismissed, ...items.map((item) => item.id)])]
    }));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-olive-900/10 bg-white text-graphite/60 transition hover:bg-[#BD9B72]/10 hover:text-[#BD9B72]"
        aria-label={unreadCount ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BD9B72] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-olive-900/10 bg-porcelain shadow-soft"
        >
          <div className="flex items-start justify-between gap-3 border-b border-olive-900/10 px-4 py-3">
            <div>
              <p className="font-display text-lg leading-none text-graphite">Notificações</p>
              <p className="mt-1 text-xs text-graphite/45">
                {unreadCount ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
              </p>
            </div>
            {items.length ? (
              <div className="flex shrink-0 items-center gap-1">
                {unreadCount ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-olive-800 transition hover:bg-linen"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar lidas
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-graphite/50 transition hover:bg-linen hover:text-graphite"
                >
                  Limpar
                </button>
              </div>
            ) : null}
          </div>

          <div className="max-h-[26rem] overflow-y-auto overscroll-contain">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-graphite/45">Carregando...</p>
            ) : items.length ? (
              <>
                {groups.map(([label, list]) => (
                  <section key={label}>
                    <p className="sticky top-0 z-10 bg-porcelain/95 px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-graphite/40 backdrop-blur">
                      {label}
                    </p>
                    <ul className="px-2 pb-1">
                      {list.map((item) => {
                        const Icon = iconFor(item);
                        const body = (
                          <>
                            <span
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                item.unread ? "bg-[#BD9B72]/15 text-[#9a7a52]" : "bg-linen text-graphite/40"
                              }`}
                            >
                              <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </span>
                            <span className="min-w-0 flex-1 pr-6">
                              <span
                                className={`block text-sm leading-5 ${
                                  item.unread ? "font-semibold text-graphite" : "font-medium text-graphite/70"
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="mt-0.5 block text-[13px] leading-5 text-graphite/55">{item.body}</span>
                              <span className="mt-1.5 flex items-center gap-2 text-[11px] text-graphite/40">
                                {item.unread ? <span className="h-1.5 w-1.5 rounded-full bg-[#BD9B72]" /> : null}
                                {formatWhen(item.createdAt)}
                              </span>
                            </span>
                          </>
                        );

                        const rowClass = "flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-linen/80";

                        return (
                          <li
                            key={item.id}
                            className={`group relative overflow-hidden transition-all duration-200 ease-out ${
                              leaving.includes(item.id) ? "max-h-0 translate-x-6 opacity-0" : "max-h-40 opacity-100"
                            }`}
                          >
                            {item.href ? (
                              <Link
                                href={item.href}
                                onClick={() => {
                                  markRead(item.id);
                                  setOpen(false);
                                }}
                                className={rowClass}
                              >
                                {body}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markRead(item.id)}
                                className={`${rowClass} w-full text-left`}
                              >
                                {body}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => dismiss(item.id)}
                              aria-label={`Dispensar: ${item.title}`}
                              className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-graphite/30 transition hover:bg-white hover:text-graphite sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}

                {hidden > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="w-full border-t border-olive-900/5 px-4 py-3 text-xs font-semibold text-olive-800 transition hover:bg-linen/70"
                  >
                    Ver mais {hidden} aviso{hidden > 1 ? "s" : ""}
                  </button>
                ) : null}
              </>
            ) : (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-linen text-graphite/40">
                  <Bell className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <p className="mt-3 text-sm font-medium text-graphite">Nenhum aviso por enquanto</p>
                <p className="mt-1 text-sm text-graphite/45">Você será avisado aqui quando houver novidades.</p>
              </div>
            )}
          </div>

          {items.length ? (
            <p className="border-t border-olive-900/5 bg-linen/40 px-4 py-2 text-center text-[10px] text-graphite/40">
              Avisos lidos somem após 2 dias.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
