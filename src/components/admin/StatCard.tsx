import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "acai",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "acai" | "berry" | "gold" | "emerald";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    acai: "bg-acai-100 text-acai-700",
    berry: "bg-berry-500/10 text-berry-600",
    gold: "bg-gold/15 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="rounded-2xl border border-acai-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-acai-400">{label}</span>
        <span className={clsx("flex h-9 w-9 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-acai-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-acai-400">{hint}</p>}
    </div>
  );
}
