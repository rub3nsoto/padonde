"use client";
// Panel del organizador — gestión de eventos, asistentes y solicitudes
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  BarChart3, Users, Eye, TrendingUp, Plus, Edit,
  Trash2, Check, X, ChevronDown, ChevronUp, Loader2,
  Calendar
} from "lucide-react";
import type { Event, Attendance } from "@/types";
import { formatEventDate, formatPrice, cn, timeAgo } from "@/lib/utils";

type TabType = "eventos" | "asistentes";

export default function DashboardPage() {
  const { isSignedIn } = useUser();
  const [tab, setTab]             = useState<TabType>("eventos");
  const [events, setEvents]       = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendances, setAttendances]     = useState<Attendance[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchMyEvents();
  }, [isSignedIn]);

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/events/mine");
      const data = await res.json();
      setEvents(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async (event: Event, estado?: string) => {
    setSelectedEvent(event);
    setTab("asistentes");
    const params = new URLSearchParams({ eventId: event.id });
    if (estado) params.set("estado", estado);
    const res  = await fetch(`/api/attendances?${params}`);
    const data = await res.json();
    setAttendances(data.data || []);
  };

  const handleDecision = async (
    attendanceId: string,
    estado: "CONFIRMED" | "REJECTED",
    nota?: string
  ) => {
    setActionLoading(attendanceId);
    try {
      const res = await fetch("/api/attendances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, estado, notaOrganizador: nota }),
      });
      if (res.ok) {
        setAttendances((prev) =>
          prev.map((a) => a.id === attendanceId ? { ...a, estado } : a)
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    if (!confirm("¿Cancelar este evento? Se notificará a todos los asistentes.")) return;
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, estado: "CANCELLED" } : e));
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-200 text-lg mb-4">Inicia sesión para ver tu dashboard</p>
          <Link href="/auth/login" className="btn-primary">Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  // Métricas generales
  const totalVistas     = events.reduce((s, e) => s + (e.vistas || 0), 0);
  const totalAsistentes = events.reduce((s, e) => s + (e.asistentesCount || 0), 0);
  const eventosActivos  = events.filter((e) => e.estado === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-gray-950">
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Gestiona tus eventos y asistentes</p>
        </div>
        <Link href="/crear" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo evento
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Eventos activos",  value: eventosActivos,  icon: Calendar,    color: "text-brand-400" },
          { label: "Total asistentes", value: totalAsistentes, icon: Users,       color: "text-green-400" },
          { label: "Vistas totales",   value: totalVistas,     icon: Eye,         color: "text-accent-cyan" },
          { label: "Total eventos",    value: events.length,   icon: BarChart3,   color: "text-accent-purple" },
        ].map((m) => (
          <div key={m.label} className="card p-5">
            <m.icon className={cn("w-5 h-5 mb-3", m.color)} />
            <p className="text-2xl font-black text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-700 border border-surface-500 rounded-xl p-1 mb-6 w-fit">
        {(["eventos", "asistentes"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
              tab === t
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/20"
                : "text-gray-400 hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ─── Tab: Eventos ─── */}
      {tab === "eventos" && (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-4 flex gap-4">
                  <div className="skeleton w-20 h-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/2 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center card">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-gray-200 font-semibold mb-2">Aún no tienes eventos</h3>
              <p className="text-gray-500 text-sm mb-6">Crea tu primer evento y empieza a conectar personas</p>
              <Link href="/crear" className="btn-primary mx-auto w-fit">Crear evento</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onViewAttendances={() => fetchAttendances(event)}
                  onViewPending={() => fetchAttendances(event, "PENDING")}
                  onCancel={() => handleCancelEvent(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Asistentes ─── */}
      {tab === "asistentes" && (
        <div>
          {selectedEvent ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => { setTab("eventos"); setSelectedEvent(null); }} className="btn-ghost text-sm">
                  ← Volver
                </button>
                <h2 className="text-gray-200 font-semibold">{selectedEvent.nombre}</h2>
              </div>

              {attendances.length === 0 ? (
                <div className="card py-12 text-center">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay asistentes aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendances.map((a) => (
                    <AttendanceRow
                      key={a.id}
                      attendance={a}
                      onApprove={() => handleDecision(a.id, "CONFIRMED")}
                      onReject={() => handleDecision(a.id, "REJECTED")}
                      loading={actionLoading === a.id}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="card py-12 text-center">
              <p className="text-gray-400">Selecciona un evento para ver sus asistentes</p>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}

// ─── Componentes hijos ────────────────────────────────────────

function EventRow({
  event, onViewAttendances, onViewPending, onCancel
}: {
  event: Event;
  onViewAttendances: () => void;
  onViewPending: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const portada = event.media?.[0]?.url;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* Miniatura */}
        <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-600">
          {portada && <Image src={portada} alt={event.nombre} fill className="object-cover" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{event.nombre}</h3>
            <span className={cn(
              "badge text-xs flex-shrink-0",
              event.estado === "ACTIVE"    ? "bg-green-500/10 text-green-400 border border-green-500/20" :
              event.estado === "CANCELLED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
              "bg-gray-500/10 text-gray-400 border border-gray-500/20"
            )}>
              {event.estado}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            {formatEventDate(event.fechaInicio)} · {formatPrice(event.precio, event.moneda)}
          </p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-600">
              <Eye className="w-3 h-3 inline mr-1" />{event.vistas || 0} vistas
            </span>
            <span className="text-xs text-gray-600">
              <Users className="w-3 h-3 inline mr-1" />{event.asistentesCount || 0} asistentes
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/evento/${event.id}`} className="btn-ghost p-2" title="Ver evento">
            <Eye className="w-4 h-4" />
          </Link>
          <Link href={`/crear?edit=${event.id}`} className="btn-ghost p-2" title="Editar">
            <Edit className="w-4 h-4" />
          </Link>
          {event.estado === "ACTIVE" && (
            <button onClick={onCancel} className="btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Cancelar">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="btn-ghost p-2">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-surface-500 p-4 flex flex-wrap gap-2">
          <button onClick={onViewAttendances} className="btn-secondary text-sm py-2">
            <Users className="w-3.5 h-3.5" />
            Ver todos los asistentes
          </button>
          {event.privacidad === "APPROVAL" && (
            <button onClick={onViewPending} className="btn-secondary text-sm py-2 text-amber-400 border-amber-500/30">
              <Users className="w-3.5 h-3.5" />
              Ver solicitudes pendientes
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AttendanceRow({
  attendance, onApprove, onReject, loading
}: {
  attendance: Attendance;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const u = attendance.user;
  return (
    <div className="card p-4 flex items-center gap-4">
      {u?.foto ? (
        <Image src={u.foto} alt={u.nombre || ""} width={40} height={40} className="rounded-full flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold flex-shrink-0">
          {u?.nombre?.[0]}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-medium text-sm">{u?.nombre}</p>
        <p className="text-gray-500 text-xs">{timeAgo(attendance.createdAt)}</p>
      </div>

      <span className={cn(
        "badge text-xs",
        attendance.estado === "CONFIRMED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
        attendance.estado === "PENDING"   ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
        attendance.estado === "REJECTED"  ? "bg-red-500/10 text-red-400 border border-red-500/20" :
        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
      )}>
        {attendance.estado}
      </span>

      {attendance.estado === "PENDING" && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={loading}
            className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
