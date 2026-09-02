"use client";

import { useTransition } from "react";
import { enviarManual } from "@/app/admin/envio-prensa/actions";

export default function EnviarBoton({
  destinatarioId,
  cuentaRemitenteId,
  disabled,
}: {
  destinatarioId: string;
  cuentaRemitenteId: string;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={() => startTransition(() => enviarManual(destinatarioId, cuentaRemitenteId))}
      className="rounded-md border border-accent px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-ink/15 disabled:text-ink/30 disabled:hover:bg-transparent"
    >
      {isPending ? "Enviando…" : "Enviar"}
    </button>
  );
}
