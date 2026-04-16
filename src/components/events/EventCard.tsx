"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Lock, Ticket } from "lucide-react";
import type { Event } from "@/types";
import {
  formatEventDate, formatPrice, formatDistancia,
  distanciaKm, getCapacidadLabel, getPorcentajeCapacidad, cn
} from "@/lib/utils";
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS } from "@/types";

const TYPE_GRADIENTS: Record<string, string> = {
  PARTY:      "from-pink-600 to-rose-600",
  CONCERT:    "from-violet-600 to-purple-600",
  SPORT:      "from-green-600 to-emerald-600",
  AFTERPARTY: "from-indigo-600 to-blue-600",
  NETWORKING: "from-blue-600 to-cyan-600",
  CULTURAL:   "from-amber-600 to-orange-600",
  OTHER:      "from-gray-600 to-slate-600",
};

interface Props {
  event:      Event;
  userLat?:  number;
  userLng?:  number;
  className?: string;
}

export default function EventCard({ event, userLat, userLng, className }: Props) {
  const portada = event.media?.[0]?.url;
  const gradient = TYPE_GRADIENTS[event.tipo] || TYPE_GRADIENTS.OTHER;
  const pct = getPorcentajeCapacidad(event.asistentesCount || 0, event.capacidadMaxima);
  const distancia = userLat && userLng
    ? distanciaKm(userLat, userLng, event.lat, event.lng)
    : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link href={`/evento/${event.id}`}>
        <article
          className={cn(
            "card overflow-hidden group cursor-pointer transition-all duration-300",
            "hover:border-brand-500/40 hover:shadow-brand",
            className
          )}
        >
          {/* Imagen / placeholder */}
          <div className="relative h-48 overflow-hidden">
            {portada ? (
              <Image
                src={portada}
                alt={event.nombre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", gradient)} />
            )}

            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Badge de tipo */}
            <div className="absolute top-3 left-3">
              <span className="badge bg-black/50 backdrop-blur-sm text-white border border-white/10">
                {EVENT_TYPE_EMOJIS[event.tipo]} {EVENT_TYPE_LABELS[event.tipo]}
              </span>
            </div>

            {/* Badge de privacidad */}
            {event.privacidad !== "PUBLIC" && (
              <div className="absolute top-3 right-3">
                <span className="badge bg-black/50 backdrop-blur-sm text-amber-300 border border-amber-500/20">
                  <Lock className="w-3 h-3" />
                  {event.privacidad === "APPROVAL" ? "Por invitación" : "Privado"}
                </span>
              </div>
            )}

            {/* Precio en la imagen */}
            <div className="absolute bottom-3 right-3">
              <span
                className={cn(
                  "badge backdrop-blur-sm font-bold",
                  event.precio
                    ? "bg-brand-500/90 text-white"
                    : "bg-green-500/90 text-white"
                )}
              >
                {formatPrice(event.precio, event.moneda)}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2 group-hover:text-brand-500 transition-colors line-clamp-2">
              {event.nombre}
            </h3>

            {/* Fecha */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <span className="truncate">{formatEventDate(event.fechaInicio)}</span>
            </div>

            {/* Ubicación */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <span className="truncate">{event.ciudad || event.direccion}</span>
              {distancia !== null && (
                <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                  {formatDistancia(distancia)}
                </span>
              )}
            </div>

            {/* Capacidad */}
            {event.capacidadMaxima && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {getCapacidadLabel(event.asistentesCount || 0, event.capacidadMaxima)}
                  </span>
                  {pct >= 80 && (
                    <span className={cn("font-medium", pct >= 100 ? "text-red-400" : "text-amber-400")}>
                      {pct >= 100 ? "¡Lleno!" : "Casi lleno"}
                    </span>
                  )}
                </div>
                <div className="h-1 bg-surface-500 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-brand-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Organizador */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-500">
              {event.creator?.foto ? (
                <Image
                  src={event.creator.foto}
                  alt={event.creator.nombre}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xs text-brand-500 font-bold">
                  {event.creator?.nombre?.[0]}
                </div>
              )}
              <span className="text-xs text-gray-400">
                por <span className="text-gray-600">{event.creator?.nombre}</span>
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

export function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
    </div>
  );
}
