import { Check } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export function OrderTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  // Se for cancelado, não mostra a timeline (ou mostra com vermelho, mas vamos simplificar).
  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-sm font-semibold">Pedido Cancelado</span>
      </div>
    );
  }

  return (
    <div className="relative mt-2 pt-2">
      <div className="absolute left-4 top-5 h-full w-[2px] bg-acai-100 dark:bg-acai-800 sm:left-auto sm:top-5 sm:h-[2px] sm:w-[calc(100%-2rem)] sm:bg-acai-100 sm:dark:bg-acai-800" />
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-0">
        {ORDER_STATUS_FLOW.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status} className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2 sm:w-20">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-white transition-colors duration-300 ${
                  isCompleted
                    ? "border-acai-500 bg-acai-500 shadow-[0_0_0_4px_rgba(127,47,201,0.15)] dark:shadow-[0_0_0_4px_rgba(127,47,201,0.25)]"
                    : "border-acai-200 bg-white dark:border-acai-700 dark:bg-acai-900"
                }`}
              >
                {isCompleted && <Check className="h-4 w-4" />}
              </div>
              <span
                className={`text-xs font-semibold sm:text-center ${
                  isCurrent
                    ? "text-acai-900 dark:text-white"
                    : isCompleted
                    ? "text-acai-600 dark:text-acai-300"
                    : "text-acai-400 dark:text-acai-500"
                }`}
              >
                {ORDER_STATUS_LABEL[status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
