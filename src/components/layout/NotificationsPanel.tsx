"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, Calendar, AlertCircle, Star } from "lucide-react";
import type { Notification } from "@/types";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NOTIF_ICONS: Record<string, React.ElementType> = {
  ATTENDANCE_CONFIRMED: CheckCheck,
  ATTENDANCE_APPROVED:  Star,
  ATTENDANCE_REJECTED:  AlertCircle,
  EVENT_REMINDER:       Calendar,
  EVENT_CANCELLED:      AlertCircle,
  NEW_NEARBY_EVENT:     Bell,
  INVITATION_RECEIVED:  Star,
};

const NOTIF_COLORS: Record<string, string> = {
  ATTENDANCE_CONFIRMED: "text-green-400 bg-green-400/10",
  ATTENDANCE_APPROVED:  "text-brand-400 bg-brand-400/10",
  ATTENDANCE_REJECTED:  "text-red-400 bg-red-400/10",
  EVENT_REMINDER:       "text-amber-400 bg-amber-400/10",
  EVENT_CANCELLED:      "text-red-400 bg-red-400/10",
  NEW_NEARBY_EVENT:     "text-accent-cyan bg-accent-cyan/10",
  INVITATION_RECEIVED:  "text-accent-purple bg-accent-purple/10",
};

interface Props {
  open:    boolean;
  onClose: () => void;
  onRead:  () => void;
}

export default function NotificationsPanel({ open, onClose, onRead }: Props) {
  const [notifs, setNotifs]     = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
    onRead();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-20 right-4 z-50 w-96 max-h-[80vh] bg-white border border-surface-500 rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-500">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllRead}
                  className="text-xs text-gray-500 hover:text-brand-500 transition-colors"
                >
                  Marcar todas como leídas
                </button>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-3/4 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Sin notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-500">
                  {notifs.map((n) => {
                    const Icon  = NOTIF_ICONS[n.tipo] || Bell;
                    const color = NOTIF_COLORS[n.tipo] || "text-gray-400 bg-gray-400/10";
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "flex gap-3 p-4 hover:bg-surface-600 transition-colors cursor-pointer",
                          !n.leida && "bg-brand-500/5"
                        )}
                        onClick={async () => {
                          if (!n.leida) {
                            await fetch("/api/notifications", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ notificationId: n.id }),
                            });
                            setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, leida: true } : x));
                          }
                        }}
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                            {!n.leida && (
                              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.mensaje}</p>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          {n.eventId && (
                            <Link
                              href={`/evento/${n.eventId}`}
                              onClick={onClose}
                              className="text-xs text-brand-500 hover:underline mt-1 inline-block"
                            >
                              Ver evento →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
