"use client";

// Tooltip que aparece onde o mouse está (e acompanha o cursor). No celular abre com um toque
// no lugar tocado e fecha ao tocar fora ou rolar a tela.

import { cloneElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const OFFSET = 14;
const MARGIN = 8;

export default function CursorTooltip({
  content,
  children,
  className = "max-w-sm rounded-xl bg-graphite px-3.5 py-3 text-xs leading-5 text-white shadow-soft"
}) {
  const [point, setPoint] = useState(null); // { x, y, pinned }
  const [style, setStyle] = useState({ left: -9999, top: -9999 });
  const boxRef = useRef(null);
  const triggerRef = useRef(null);

  // Mantém a caixa dentro da tela: prefere abaixo/à direita do ponto, vira para o outro lado se faltar espaço.
  useLayoutEffect(() => {
    if (!point || !boxRef.current) return;
    const { width, height } = boxRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = point.x + OFFSET;
    let top = point.y + OFFSET;
    if (left + width + MARGIN > vw) left = point.x - OFFSET - width;
    if (top + height + MARGIN > vh) top = point.y - OFFSET - height;
    left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - width - MARGIN));
    top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - height - MARGIN));
    setStyle({ left, top });
  }, [point]);

  const close = useCallback(() => setPoint(null), []);

  useEffect(() => {
    if (!point?.pinned) return undefined;
    function onPointerDown(event) {
      if (boxRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      close();
    }
    function onKey(event) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", close, { capture: true });
      document.removeEventListener("keydown", onKey);
    };
  }, [point?.pinned, close]);

  const trigger = cloneElement(children, {
    ref: triggerRef,
    onPointerEnter: (event) => {
      if (event.pointerType === "mouse") setPoint({ x: event.clientX, y: event.clientY, pinned: false });
    },
    onPointerMove: (event) => {
      if (event.pointerType === "mouse" && !point?.pinned) setPoint({ x: event.clientX, y: event.clientY, pinned: false });
    },
    onPointerLeave: (event) => {
      if (event.pointerType === "mouse" && !point?.pinned) close();
    },
    onClick: (event) => {
      children.props.onClick?.(event);
      // Toque (ou clique): fixa a tabela no ponto tocado; tocar de novo fecha.
      if (point?.pinned) {
        close();
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX || rect.left + rect.width / 2;
      const y = event.clientY || rect.top + rect.height / 2;
      setPoint({ x, y, pinned: true });
    },
    onFocus: (event) => {
      children.props.onFocus?.(event);
      if (event.currentTarget.matches(":focus-visible")) {
        const rect = event.currentTarget.getBoundingClientRect();
        setPoint({ x: rect.left + 24, y: rect.bottom - OFFSET, pinned: false });
      }
    },
    onBlur: (event) => {
      children.props.onBlur?.(event);
      if (!point?.pinned) close();
    },
    "aria-expanded": Boolean(point)
  });

  return (
    <>
      {trigger}
      {point && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={boxRef}
              role="tooltip"
              className={`fixed z-[70] ${point.pinned ? "" : "pointer-events-none"} ${className}`}
              style={style}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
