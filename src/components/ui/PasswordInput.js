"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClassName } from "@/components/layout/AppShell";

export default function PasswordInput({
  id,
  value,
  onChange,
  className,
  autoComplete = "current-password",
  required,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const resolvedClassName = className ?? inputClassName("pr-11");

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className={resolvedClassName}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-graphite/45 transition hover:text-graphite/70 focus:outline-none focus:ring-2 focus:ring-olive-200"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
