import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-acai-500">
      <Loader2 className={clsx("h-8 w-8 animate-spin", className)} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
}

export function FullPageSpinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-cream">
      <Spinner label={label} />
    </div>
  );
}
