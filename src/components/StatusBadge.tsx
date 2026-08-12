import clsx from "clsx";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABEL } from "@/lib/types";

const styles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  confirmed: "bg-sky-100 text-sky-700 ring-sky-200",
  preparing: "bg-acai-100 text-acai-700 ring-acai-200",
  out_for_delivery: "bg-orange-100 text-orange-700 ring-orange-200",
  delivered: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  cancelled: "bg-red-100 text-red-700 ring-red-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
        styles[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
