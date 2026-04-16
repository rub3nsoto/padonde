export const dynamic = "force-dynamic";
"use client";
// Gestión de asistentes de un evento — solo para el organizador
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft, Users, Clock, CheckCircle, XCircle,
  Loader2, Trash2, Eye, UserCheck, UserX, Search
} from "lucide-react";
import { cn, formatEventDate } from "@/lib/utils";
import toast from "react-hot-toast";

type AttendanceEstado = "CONFIRMED" | "RESERVED" | "PENDING" | "REJECTED" | "CANCELLED";

interface Attendee {
  id: string;
  estado: AttendanceEstado;
  notaOrganizador?: string;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    foto?: string;
    email: string;
  };
}

interface EventInfo {
  id: string;
  nombre: string;
  capacidadMaxima?: number;
  aceptarSolicitudesCuandoLleno: boolean;
  fechaInicio: string;
}

const TAB_CONFIG = [
  { value: "activos",  label: "Confirmados",    estados: ["CONFIRMED", "RESERVED"] as AttendanceEstado[] },
  { value: "espera",   label: "Lista de espera", estados: ["PENDING"] as AttendanceEstado[]  },
  { value: "rechazados", label: "Rechazados",    estados: ["REJECTED", "CANCELLED"] as AttendanceEstado[] },
];

export default function AsistentesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router       = useRouter();
  const { isSignedIn } = useUser();

  const [evento, setEvento]         = useState<EventInfo | null>(null);
  const [asistentes, setAsistentes] = useState<Attendee[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("activos");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch]         = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, attRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/attendances?eventId=${eventId}`),
      ]);
      const [evData, attData] = await Promise.all([evRes.json(), attRes.json()]);

      if (evData.error) { router.push("/mis-eventos"); return; }
      setEvento(evData.data);
      setAsistentes(attData.data || []);
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchData();
  }, [isSignedIn, fetchData]);

  const currentTabEstados = TAB_CONFIG.find((t) => t.value === tab)?.estados || [];
  const filtered = asistentes
    .filter((a) => currentTabEstados.includes(a.estado))
    .filter((a) =>
      !search ||
      a.user.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase())
    );

  const activos    = asistentes.filter((a) => ["CONFIRMED", "RESERVED"].includes(a.estado));
  const enEspera   = asistentes.filter((a) => a.estado === "PENDING");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  const handleAction = async (
    attendanceId: string,
    estado: "CONFIRMED" | "REJECTED" | "CANCELLED",
    nota?: string
  ) => {
    setActionLoading(attendanceId);
    try {
      const res = await fetch("/api/attendances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, estado, notaOrganizador: nota }),
      });
      if (!res.ok) { toast.error("Error al actualizar"); return; }
      setAsistentes((prev) =>
        prev.map((a) => a.id === attendanceId ? { ...a, estado } : a)
      );
      setSelected((prev) => { const next = new Set(prev); next.delete(attendanceId); return next; });
      const labels: Record<string, string> = {
        CONFIRMED: "Aprobado ✓",
        REJECTED:  "Rechazado",
        CANCELLED: "Asistencia cancelada",
      };
      toast.success(labels[estado]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkCancel = async () => {
    if (!confirm(`¿Cancelar la asistencia de ${selected.size} persona(s)?`)) return;
    for (const id of Array.from(selected)) {
      await handleAction(id, "CANCELLED");
    }
    setSelected(new Set());
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Inicia sesión para continuar</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mis-eventos" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-white truncate">
            {loading ? "Cargando..." : `Asistentes — ${evento?.nombre}`}
          </h1>
          {evento && (
            <p className="text-gray-400 text-sm">
              {formatEventDate(evento.fechaInicio)} ·{" "}
              {activos.length}{evento.capacidadMaxima ? `/${evento.capacidadMaxima}` : ""} confirmados
              {evento.aceptarSolicitudesCuandoLleno && enEspera.length > 0 && (
                <span className="ml-2 text-amber-400">· {enEspera.length} en lista de espera</span>
              )}
            </p>
          )}
        </div>
        <Link href={`/evento/${eventId}`} className="btn-secondary hidden sm:flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4" /> Ver evento
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-700 border border-surface-500 rounded-xl p-1 mb-5 w-fit overflow-x-auto">
        {TAB_CONFIG.map((t) => {
          const count = asistentes.filter((a) => t.estados.includes(a.estado)).length;
          return (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setSelected(new Set()); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                tab === t.value
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/20"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs font-bold",
                  t.value === "activos"   ? "text-green-400" :
                  t.value === "espera"    ? "text-amber-400" : "text-gray-500"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Barra de búsqueda + acciones bulk */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="input pl-9 py-2 text-sm"
          />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{selected.size} seleccionados</span>
            {tab === "espera" && (
              <button
                onClick={async () => {
                  for (const id of Array.from(selected)) { await handleAction(id, "CONFIRMED"); }
                  setSelected(new Set());
                }}
                className="btn-primary text-sm py-2 flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" /> Aprobar todos
              </button>
            )}
            <button
              onClick={handleBulkCancel}
              className="btn-ghost text-sm py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Cancelar selección
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-14 text-center">
          <div className="text-4xl mb-3">
            {tab === "activos" ? "👥" : tab === "espera" ? "⏳" : "📋"}
          </div>
          <p className="text-gray-400 text-sm">
            {tab === "activos"    ? "Aún no hay asistentes confirmados." :
             tab === "espera"     ? "No hay nadie en la lista de espera." :
             "No hay asistencias rechazadas o canceladas."}
          </p>
          {tab === "espera" && !evento?.aceptarSolicitudesCuandoLleno && (
            <p className="text-gray-600 text-xs mt-2">
              Activa "Lista de espera" al editar el evento para recibir solicitudes cuando esté lleno.
            </p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header de la tabla */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-500 bg-surface-700">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-brand-500 cursor-pointer"
            />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide flex-1">
              Asistente
            </span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide hidden sm:block w-40">
              Registro
            </span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide w-32 text-right">
              Acciones
            </span>
          </div>

          {/* Filas */}
          <div className="divide-y divide-surface-600">
            {filtered.map((a) => (
              <AttendeeRow
                key={a.id}
                attendee={a}
                selected={selected.has(a.id)}
                onToggle={() => toggleSelect(a.id)}
                onAction={handleAction}
                actionLoading={actionLoading === a.id}
                tab={tab}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fila individual ─────────────────────────────────────────

function AttendeeRow({
  attendee,
  selected,
  onToggle,
  onAction,
  actionLoading,
  tab,
}: {
  attendee: Attendee;
  selected: boolean;
  onToggle: () => void;
  onAction: (id: string, estado: "CONFIRMED" | "REJECTED" | "CANCELLED", nota?: string) => void;
  actionLoading: boolean;
  tab: string;
}) {
  const [showNota, setShowNota] = useState(false);
  const [nota, setNota]         = useState("");

  const handleCancel = () => {
    setShowNota(true);
  };

  const confirmCancel = () => {
    onAction(attendee.id, "CANCELLED", nota || undefined);
    setShowNota(false);
    setNota("");
  };

  return (
    <div className={cn(
      "px-4 py-3 transition-colors",
      selected ? "bg-brand-500/5" : "hover:bg-surface-700/50"
    )}>
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 accent-brand-500 cursor-pointer flex-shrink-0"
        />

        {/* Avatar + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-600 flex-shrink-0">
            {attendee.user.foto ? (
              <Image src={attendee.user.foto} alt={attendee.user.nombre} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                {attendee.user.nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{attendee.user.nombre}</p>
            <p className="text-xs text-gray-500 truncate">{attendee.user.email}</p>
          </div>
        </div>

        {/* Fecha de registro */}
        <div className="hidden sm:block w-40 text-xs text-gray-500">
          {new Date(attendee.createdAt).toLocaleDateString("es-MX", {
            day: "numeric", month: "short", year: "numeric"
          })}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 w-32 justify-end">
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <>
              {/* Ver perfil */}
              <Link
                href={`/perfil/${attendee.user.id}`}
                className="btn-ghost p-1.5 text-gray-400 hover:text-white"
                title="Ver perfil"
              >
                <Eye className="w-4 h-4" />
              </Link>

              {/* Aprobar (solo en lista de espera) */}
              {tab === "espera" && (
                <button
                  onClick={() => onAction(attendee.id, "CONFIRMED")}
                  className="btn-ghost p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  title="Aprobar solicitud"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
              )}

              {/* Rechazar (solo en lista de espera) */}
              {tab === "espera" && (
                <button
                  onClick={() => onAction(attendee.id, "REJECTED")}
                  className="btn-ghost p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Rechazar solicitud"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}

              {/* Cancelar asistencia (solo confirmados) */}
              {tab === "activos" && (
                <button
                  onClick={handleCancel}
                  className="btn-ghost p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Cancelar asistencia"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nota para cancelación */}
      {showNota && (
        <div className="mt-3 ml-7 p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
          <p className="text-xs text-red-400 font-medium">Motivo de cancelación (opcional)</p>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. No cumple requisitos, evento modificado..."
            className="input text-sm py-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => setShowNota(false)} className="btn-ghost text-xs py-1.5 px-3">
              Cancelar
            </button>
            <button
              onClick={confirmCancel}
              className="btn-primary text-xs py-1.5 px-3 bg-red-500 hover:bg-red-600 border-red-500"
            >
              Confirmar cancelación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
