"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Users, Lock, Ticket, Share2,
  CalendarPlus, ExternalLink, ChevronLeft, ChevronRight,
  Clock, DollarSign, Shirt, Info, CheckCircle, Loader2,
  AlertTriangle, Edit, X, ZoomIn
} from "lucide-react";
import dynamic from "next/dynamic";
import type { Event, AttendanceStatus } from "@/types";
import {
  formatEventDateRange, formatPrice, getCapacidadLabel,
  getPorcentajeCapacidad, cn, getEventShareUrl
} from "@/lib/utils";
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS, PRIVACY_LABELS } from "@/types";
// Inline para evitar importar ical-generator (Node.js only) en el bundle del cliente
function getGoogleCalendarUrl(evento: {
  nombre: string; descripcion: string; fechaInicio: Date;
  fechaFin: Date; direccion: string; url: string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const p = new URLSearchParams({
    action: "TEMPLATE", text: evento.nombre,
    dates: `${fmt(evento.fechaInicio)}/${fmt(evento.fechaFin)}`,
    details: `${evento.descripcion}\n\n${evento.url}`,
    location: evento.direccion,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const EventMap = dynamic(() => import("@/components/maps/EventMap"), { ssr: false });

interface Props {
  initialEvent: Event;
  invToken?:    string;
  pagoStatus?:  string;
}

export default function EventDetailClient({ initialEvent, invToken, pagoStatus }: Props) {
  const { isSignedIn, user } = useUser();
  const [event, setEvent]           = useState<Event>(initialEvent);
  const [mediaIdx, setMediaIdx]     = useState(0);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(
    initialEvent.userAttendance || null
  );
  const [loading, setLoading]       = useState(false);
  const [calOpen, setCalOpen]       = useState(false);
  const [lightbox, setLightbox]     = useState(false);

  // Notificar estado del pago de Stripe
  useEffect(() => {
    if (pagoStatus === "exitoso") toast.success("¡Pago exitoso! Tu lugar está reservado.");
    if (pagoStatus === "cancelado") toast.error("Pago cancelado. Puedes intentarlo nuevamente.");
  }, [pagoStatus]);

  const handleAttend = async () => {
    if (!isSignedIn) { toast.error("Inicia sesión para asistir a eventos"); return; }
    if (loading) return;
    setLoading(true);

    try {
      // Evento de pago → Stripe (deshabilitado en modo local; descomentar en producción)
      if (event.precio && event.precio > 0) {
        toast("Pagos deshabilitados en modo de prueba. El evento requiere pago.", { icon: "💳" });
        setLoading(false);
        return;
        /* PRODUCCIÓN: descomentar esto y borrar las líneas de arriba
        const res  = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id }),
        });
        const data = await res.json();
        if (data.url) { window.location.href = data.url; return; }
        toast.error(data.error || "Error al procesar el pago");
        return;
        */
      }

      const res  = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json();

      if (res.ok) {
        const estado = data.data.estado as AttendanceStatus;
        setAttendance(estado);
        setEvent((e) => ({ ...e, asistentesCount: (e.asistentesCount || 0) + 1 }));
        if (estado === "CONFIRMED") toast.success("¡Asistencia confirmada!");
        else if (estado === "PENDING") toast.success("Solicitud enviada. El organizador la revisará.");
      } else if (res.status === 404) {
        // El usuario no tiene perfil en DB — redirigir a completar registro
        toast.error("Necesitas completar tu perfil primero");
        setTimeout(() => {
          window.location.href = `/auth/registro?step=perfil&redirect=/evento/${event.id}`;
        }, 1500);
      } else if (res.status === 403) {
        toast.error(data.error || "Debes verificar tu edad para asistir");
      } else {
        toast.error(data.error || "Error al registrar asistencia");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAttendance = async () => {
    if (!confirm("¿Cancelar tu asistencia?")) return;
    setLoading(true);
    try {
      await fetch(`/api/attendances?eventId=${event.id}`, { method: "DELETE" });
      setAttendance(null);
      setEvent((e) => ({ ...e, asistentesCount: Math.max(0, (e.asistentesCount || 1) - 1) }));
      toast.success("Asistencia cancelada");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = getEventShareUrl(event.id, invToken);
    if (navigator.share) {
      await navigator.share({ title: event.nombre, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("¡Link copiado al portapapeles!");
    }
  };

  const downloadICS = () => {
    window.location.href = `/api/calendar?eventId=${event.id}`;
  };

  const pct = getPorcentajeCapacidad(event.asistentesCount || 0, event.capacidadMaxima);
  const isFull = event.capacidadMaxima && (event.asistentesCount || 0) >= event.capacidadMaxima;

  const isCreator = isSignedIn && user?.id && user.id === event.creator.clerkId;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Lightbox */}
      {lightbox && event.media[mediaIdx]?.tipo === "PHOTO" && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(false)}
          >
            <X className="w-5 h-5" />
          </button>
          {event.media.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setMediaIdx((i) => (i - 1 + event.media.length) % event.media.length); }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setMediaIdx((i) => (i + 1) % event.media.length); }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={event.media[mediaIdx].url}
              alt={`${event.nombre} — foto ${mediaIdx + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {mediaIdx + 1} / {event.media.length}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-2 text-sm text-gray-500 mb-6">
        <div className="flex items-center gap-2">
          <Link href="/explorar" className="hover:text-gray-900">Explorar</Link>
          <span>/</span>
          <span className="text-gray-700 truncate">{event.nombre}</span>
        </div>
        {isCreator && (
          <Link href={`/crear?edit=${event.id}`} className="btn-secondary py-1.5 text-sm flex items-center gap-1.5">
            <Edit className="w-3.5 h-3.5" />
            Editar evento
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* ─── Columna principal ─── */}
        <div>
          {/* Carrusel de media */}
          {event.media.length > 0 ? (
            <div className="relative h-72 sm:h-[420px] rounded-2xl overflow-hidden mb-6 bg-surface-600 group">
              <Image
                src={event.media[mediaIdx].url}
                alt={`${event.nombre} — foto ${mediaIdx + 1}`}
                fill
                className="object-cover"
                priority
              />
              {/* Click para abrir lightbox */}
              {event.media[mediaIdx]?.tipo === "PHOTO" && (
                <button
                  onClick={() => setLightbox(true)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 cursor-zoom-in"
                >
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </button>
              )}

              {/* Controles */}
              {event.media.length > 1 && (
                <>
                  <button
                    onClick={() => setMediaIdx((i) => (i - 1 + event.media.length) % event.media.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMediaIdx((i) => (i + 1) % event.media.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {event.media.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setMediaIdx(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === mediaIdx ? "w-6 bg-white" : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Badges superpuestos */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="badge bg-black/60 backdrop-blur-sm text-white border border-white/10">
                  {EVENT_TYPE_EMOJIS[event.tipo]} {EVENT_TYPE_LABELS[event.tipo]}
                </span>
                {event.privacidad !== "PUBLIC" && (
                  <span className="badge bg-black/60 backdrop-blur-sm text-amber-300 border border-amber-500/20">
                    <Lock className="w-3 h-3" />
                    {PRIVACY_LABELS[event.privacidad]}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-56 rounded-2xl bg-gradient-brand opacity-70 mb-6" />
          )}

          {/* Thumbnail strip */}
          {event.media.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {event.media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setMediaIdx(i)}
                  className={cn(
                    "relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                    i === mediaIdx ? "border-brand-500" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  {m.tipo === "PHOTO" ? (
                    <Image src={m.url} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-600 flex items-center justify-center text-gray-500">
                      ▶
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Título y descripción */}
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">{event.nombre}</h1>

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.map((tag) => (
                <span key={tag} className="badge bg-surface-600 text-gray-600 border border-surface-500 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
            {event.descripcion}
          </p>

          {/* Detalles extra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {event.codigoVestimenta && (
              <div className="card p-4 flex gap-3">
                <Shirt className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Código de vestimenta</p>
                  <p className="text-gray-900 text-sm font-medium">{event.codigoVestimenta}</p>
                </div>
              </div>
            )}
            {event.instrucciones && (
              <div className="card p-4 flex gap-3">
                <Info className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Instrucciones especiales</p>
                  <p className="text-gray-700 text-sm">{event.instrucciones}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mapa */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              Ubicación
            </h2>
            <p className="text-gray-600 text-sm mb-3">{event.direccion}</p>
            <div className="h-56 rounded-2xl overflow-hidden">
              <EventMap
                events={[event]}
                center={[event.lat, event.lng]}
                zoom={15}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Organizador */}
          <div className="card p-5 flex items-center gap-4">
            <Link href={`/perfil/${event.creator.id}`}>
              {event.creator.foto ? (
                <Image
                  src={event.creator.foto}
                  alt={event.creator.nombre}
                  width={56}
                  height={56}
                  className="rounded-full ring-2 ring-brand-500/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-brand flex items-center justify-center text-xl font-bold text-white">
                  {event.creator.nombre[0]}
                </div>
              )}
            </Link>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Organizado por</p>
              <Link href={`/perfil/${event.creator.id}`} className="font-semibold text-gray-900 hover:text-brand-500 transition-colors">
                {event.creator.nombre}
              </Link>
              {event.creator.bio && (
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{event.creator.bio}</p>
              )}
            </div>
            <Link href={`/perfil/${event.creator.id}`} className="ml-auto btn-ghost text-sm">
              Ver perfil <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Aviso legal */}
          <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Eventure es únicamente un intermediario tecnológico. No organiza, supervisa ni
              garantiza la veracidad de este evento. El organizador es el único responsable
              de su realización, seguridad y cumplimiento legal.{" "}
              <Link href="/legal/terminos" className="underline hover:text-amber-900">Ver T&C</Link>
            </p>
          </div>
        </div>

        {/* ─── Sidebar sticky ─── */}
        <div>
          <div className="sticky top-24">
            <div className="card p-6">
              {/* Precio */}
              <div className="flex items-baseline gap-2 mb-6">
                {event.precio ? (
                  <>
                    <span className="text-3xl font-black text-gray-900">
                      {formatPrice(event.precio, event.moneda)}
                    </span>
                    <span className="text-gray-500 text-sm">por persona</span>
                  </>
                ) : (
                  <span className="text-3xl font-black text-green-600">Gratis</span>
                )}
              </div>

              {/* Info rápida */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    {formatEventDateRange(event.fechaInicio, event.fechaFin)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span className="text-gray-700 line-clamp-2">{event.direccion}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    {getCapacidadLabel(event.asistentesCount || 0, event.capacidadMaxima)}
                  </span>
                </div>
              </div>

              {/* Barra de capacidad */}
              {event.capacidadMaxima && (
                <div className="mb-6">
                  <div className="h-1.5 bg-surface-500 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-brand-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pct >= 80 && !isFull && (
                    <p className="text-amber-600 text-xs mt-1">
                      ¡Quedan pocos lugares!
                    </p>
                  )}
                </div>
              )}

              {/* Botón de acción principal */}
              {event.estado === "CANCELLED" ? (
                <div className="w-full py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-600 text-sm font-medium mb-4">
                  Este evento fue cancelado
                </div>
              ) : attendance === "CONFIRMED" || attendance === "RESERVED" ? (
                <div className="space-y-3 mb-4">
                  <div className="w-full py-3 px-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center text-green-600 text-sm font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {attendance === "RESERVED" ? "Lugar reservado" : "Asistencia confirmada"}
                  </div>
                  <button
                    onClick={handleCancelAttendance}
                    disabled={loading}
                    className="w-full btn-ghost text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    Cancelar asistencia
                  </button>
                </div>
              ) : attendance === "PENDING" ? (
                <div className="w-full py-3 px-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center text-amber-600 text-sm font-medium mb-4">
                  Solicitud pendiente de aprobación
                </div>
              ) : (
                <button
                  onClick={handleAttend}
                  disabled={loading || !!isFull}
                  className={cn(
                    "w-full btn-primary py-4 text-base mb-4",
                    isFull && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isFull ? (
                    "Sin lugares disponibles"
                  ) : event.precio ? (
                    <><Ticket className="w-4 h-4" /> Reservar por {formatPrice(event.precio, event.moneda)}</>
                  ) : event.privacidad === "APPROVAL" ? (
                    "Solicitar invitación"
                  ) : (
                    "Asistir al evento"
                  )}
                </button>
              )}

              {/* Acciones secundarias */}
              <div className="grid grid-cols-2 gap-2">
                {/* Agregar al calendario */}
                <div className="relative">
                  <button
                    onClick={() => setCalOpen(!calOpen)}
                    className="w-full btn-secondary py-2.5 text-sm"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Calendario
                  </button>
                  {calOpen && (
                    <div className="absolute bottom-12 left-0 bg-white border border-surface-500 rounded-xl p-2 w-48 z-10 shadow-lg">
                      <button
                        onClick={downloadICS}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-surface-600 rounded-lg transition-colors"
                      >
                        📅 Descargar .ics
                      </button>
                      <a
                        href={getGoogleCalendarUrl({
                          nombre:      event.nombre,
                          descripcion: event.descripcion,
                          fechaInicio: new Date(event.fechaInicio),
                          fechaFin:    new Date(event.fechaFin),
                          direccion:   event.direccion,
                          url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/evento/${event.id}`,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-surface-600 rounded-lg transition-colors"
                      >
                        📆 Google Calendar
                      </a>
                    </div>
                  )}
                </div>

                {/* Compartir */}
                <button
                  onClick={handleShare}
                  className="btn-secondary py-2.5 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
