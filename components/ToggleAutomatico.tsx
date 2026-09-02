"use client";

import { useState, useTransition } from "react";
import { setEnvioAutomatico } from "@/app/admin/envio-prensa/actions";

export default function ToggleAutomatico({ activo }: { activo: boolean }) {
  const [checked, setChecked] = useState(activo);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !checked;
    setChecked(next);
    startTransition(() => setEnvioAutomatico(next));
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white px-5 py-4">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={isPending}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-ink">Envío automático de contenido</p>
        <p className="text-xs text-ink/50">
          {checked
            ? "Activado — el agente envía por su cuenta, respetando el límite diario."
            : "Desactivado — cada envío requiere pulsar \"Enviar\" junto a la dirección."}
        </p>
      </div>
    </div>
  );
}
