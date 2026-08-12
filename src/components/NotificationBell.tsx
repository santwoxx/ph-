"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToCustomerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/data/notifications";
import type { AppNotification } from "@/lib/types";

function timeAgo(ts: number): string {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.round(diffH / 24)}d`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Sem usuário o componente nem chega a renderizar (return null abaixo),
    // então não precisa resetar `notifications` nesse caso — só evita
    // assinar o Firestore à toa.
    if (!user) return;
    const unsub = subscribeToCustomerNotifications(user.uid, setNotifications, () =>
      setNotifications([])
    );
    return () => unsub();
  }, [user]);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-acai-100 text-acai-800 transition hover:border-acai-300 dark:border-acai-800 dark:text-acai-100 dark:hover:border-acai-600 sm:h-12 sm:w-12"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry-500 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-acai-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-acai-100 bg-white shadow-soft animate-scale-in dark:border-acai-800 dark:bg-acai-900">
            <div className="flex items-center justify-between border-b border-acai-100 px-4 py-3 dark:border-acai-800">
              <p className="text-sm font-bold text-acai-950 dark:text-white">Notificações</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsRead(notifications)}
                  className="text-xs font-semibold text-acai-500 hover:text-acai-700 dark:text-acai-400"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-acai-400">
                  Nenhuma notificação ainda.
                </p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href="/meus-pedidos"
                    onClick={() => {
                      setOpen(false);
                      if (!n.read) markNotificationRead(n.id);
                    }}
                    className={`block border-b border-acai-50 px-4 py-3 text-left transition hover:bg-acai-50 dark:border-acai-800 dark:hover:bg-acai-800 ${
                      !n.read ? "bg-acai-50/60 dark:bg-acai-800/40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-berry-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-acai-900 dark:text-acai-100">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-acai-500 dark:text-acai-400">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[11px] text-acai-300 dark:text-acai-500">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
