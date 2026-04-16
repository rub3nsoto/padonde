export const dynamic = "force-dynamic";
"use client";
// Eventos del usuario — los que va a asistir y los que organiza
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Calendar, MapPin, X, Loader2, Edit, Eye, Users, UserCog } from "lucide-react";
import type { Attendance, Event } from "@/types";
import { formatEventDate, formatPrice, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_TABS = [
  { value: "CONFIRMED", label: "Confirmados", color: "text-green-400" },
  { value: "RESERVED",  label: "Reservados",  color: "text-blue-400" },
  { value: "PENDING",   label: "Pendientes",  color: "text-amber-400" },
];

type MainTab = "asistiendo" | "organizados";

export default function MisEventosPage() {
  const { isSignedIn } = useUser();
  const [mainTab, setMainTab]         = useState<MainTab>("asistiendo");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [myEvents, setMyEvents]       = useState<Event[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusTab, setStatusTab]     = useState("CONFIRMED");
  const [cancelling, setCancelling]   = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchAll();
  }, [isSignedIn]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [attRes, evRes] = await Promise.all([
        fetch("/api/attendances/mine"),
        fetch("/api/events/mine"),
      ]);
      const [attData, evData] = await Promise.all([attRes.json(), evRes.json()]);
      setAttendances(attData.data || []);
      setMyEvents(evData.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (!confirm("¿Cancelar tu asistencia a este evento?")) return;
    setCancelling(eventId);
    try {
      await fetch(`/api/attendances?eventId=${eventId}`, { method: "DELETE" });
      setAttendances((prev) => prev.filter((a) => a.eventId !== eventId));
      toast.success("Asistencia cancelada");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = attendances.filter((a) => a.estado === statusTab);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Inicia sesión para ver tus eventos</p>
          <Link href="/auth/login" className="btn-primary">Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-white mb-2">Mis Eventos</h1>
      <p className="text-gray-400 mb-8">Eventos a los que asistes y los que organizas</p>

      {/* Tabs principales */}
      <div className="flex gap-1 bg-surface-700 border border-surface-500 rounded-xl p-1 mb-6 w-fit">
        {([
          { value: "asistiendo", label: "Asistiendo" },
          { value: "organizados", label: "Mis eventos" },
        ] as { value: MainTab; label: string }[]).map((t) => (
          <button
            key={t.value}
            onClick={() => setMainTab(t.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mainTab === t.value
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/20"
                : "text-gray-400 hover:text-white"
            )}
          >
            {t.label}
            {t.value === "asistiendo" && attendances.length > 0 && (
              <span className="ml-2 text-xs font-bold text-brand-400">{attendances.length}</span>
            )}
            {t.value === "organizados" && myEvents.length > 0 && (
              <span className="ml-2 text-xs font-bold text-brand-400">{myEvents.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-32 h-24 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : mainTab === "asistiendo" ? (
        <>
          {/* Sub-tabs de estado */}
          <div className="flex gap-1 bg-surface-700 border border-surface-500 rounded-xl p-1 mb-6 w-fit">
            {STATUS_TABS.map((t) => {
              const count = attendances.filter((a) => a.estado === t.value).length;
              return (
                <button
                  key={t.value}
                  onClick={() => setStatusTab(t.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    statusTab === t.value
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/20"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {t.label}
                  {count > 0 && <span className={cn("text-xs font-bold", t.color)}>{count}</span>}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="card py-16 text-center">
              <div className="text-5xl mb-4">🎟️</div>
              <h3 className="text-white font-semibold mb-2">
                No tienes eventos {STATUS_TABS.find((t) => t.value === statusTab)?.label.toLowerCase()}
              </h3>
              <p className="text-gray-500 text-sm mb-6">Explora eventos cercanos y regístrate</p>
              <Link href="/explorar" className="btn-primary mx-auto w-fit">Explorar eventos</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((a) => {
                const event = a.event as any;
                if (!event) return null;
                return (
                  <div key={a.id} className="card flex gap-4 p-4 hover:border-brand-500/30 transition-colors">
                    <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-600">
                      {event.media?.[0]?.url && (
                        <Image src={event.media[0].url} alt={event.nombre} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/evento/${event.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-brand-500 transition-colors">{event.nombre}</h3>
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <Calendar className="w-3 h-3 text-brand-400" />
                        {formatEventDate(event.fechaInicio)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-brand-400" />
                        {event.ciudad || event.direccion}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn(
                          "badge text-xs",
                          a.estado === "CONFIRMED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          a.estado === "RESERVED"  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {a.estado === "CONFIRMED" ? "✓ Confirmado" :
                           a.estado === "RESERVED"  ? "💳 Reservado" :
                           "⏳ Pendiente"}
                        </span>
                        {event.precio && (
                          <span className="text-xs text-gray-500">{formatPrice(event.precio, event.moneda)}</span>
                        )}
                      </div>
                    </div>
                    {(a.estado === "CONFIRMED" || a.estado === "PENDING") && (
                      <button
                        onClick={() => handleCancel(event.id)}
                        disabled={cancelling === event.id}
                        className="self-start btn-ghost p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                        title="Cancelar asistencia"
                      >
                        {cancelling === event.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <X className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ─── Tab: Organizados ─── */
        myEvents.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-white font-semibold mb-2">Aún no has creado eventos</h3>
            <p className="text-gray-500 text-sm mb-6">Crea tu primer evento y empieza a conectar personas</p>
            <Link href="/crear" className="btn-primary mx-auto w-fit">Crear evento</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvents.map((event) => {
              const portada = event.media?.[0]?.url;
              return (
                <div key={event.id} className="card flex gap-4 p-4 hover:border-brand-500/30 transition-colors">
                  <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-600">
                    {portada && <Image src={portada} alt={event.nombre} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Link href={`/evento/${event.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-brand-500 transition-colors">{event.nombre}</h3>
                      </Link>
                      <span className={cn(
                        "badge text-xs flex-shrink-0",
                        event.estado === "ACTIVE"    ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        event.estado === "CANCELLED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      )}>
                        {event.estado === "ACTIVE" ? "Activo" : event.estado === "CANCELLED" ? "Cancelado" : event.estado}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 text-brand-400" />
                      {formatEventDate(event.fechaInicio)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-brand-400" />
                      {event.ciudad || event.direccion}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.asistentesCount || 0} asistentes
                      </span>
                      {event.precio
                        ? <span>{formatPrice(event.precio, event.moneda)}</span>
                        : <span className="text-green-500/70">Gratis</span>
                      }
                    </div>
                  </div>
                  <div className="flex items-start gap-1 flex-shrink-0">
                    <Link href={`/evento/${event.id}`} className="btn-ghost p-2" title="Ver evento">
                      <Eye className="w-4 h-4" />
                    </Link>
                    {event.estado === "ACTIVE" && (
                      <>
                        <Link
                          href={`/mis-eventos/${event.id}/asistentes`}
                          className="btn-ghost p-2 text-brand-400 hover:bg-brand-500/10"
                          title="Gestionar asistentes"
                        >
                          <UserCog className="w-4 h-4" />
                        </Link>
                        <Link href={`/crear?edit=${event.id}`} className="btn-ghost p-2" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
