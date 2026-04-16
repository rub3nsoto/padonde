import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from "date-fns";
import { es } from "date-fns/locale";

// Utilidad de clases CSS — combina clsx + tailwind-merge para resolver conflictos
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Fechas ──────────────────────────────────────────────────

export function formatEventDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `Hoy, ${format(d, "HH:mm", { locale: es })}`;
  if (isTomorrow(d)) return `Mañana, ${format(d, "HH:mm", { locale: es })}`;
  if (isThisWeek(d)) return format(d, "EEEE d MMM · HH:mm", { locale: es });
  return format(d, "d MMM yyyy · HH:mm", { locale: es });
}

export function formatEventDateRange(start: string | Date, end: string | Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const startStr = format(s, "d MMM yyyy", { locale: es });
  const endStr = format(e, "d MMM yyyy", { locale: es });
  const timeRange = `${format(s, "HH:mm")} – ${format(e, "HH:mm")}`;
  if (startStr === endStr) return `${startStr} · ${timeRange}`;
  return `${startStr} – ${endStr} · ${timeRange}`;
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

// ─── Precios ─────────────────────────────────────────────────

export function formatPrice(precio?: number | null, moneda = "MXN"): string {
  if (!precio || precio === 0) return "Gratis";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 0,
  }).format(precio);
}

// ─── Geolocalización ─────────────────────────────────────────

// Haversine formula — distancia entre dos puntos en km
export function distanciaKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Edad ────────────────────────────────────────────────────

export function calcularEdad(fechaNacimiento: string | Date): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

export function esMayorDeEdad(fechaNacimiento: string | Date): boolean {
  return calcularEdad(fechaNacimiento) >= 18;
}

// ─── Texto ───────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + "…";
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ─── URLs ────────────────────────────────────────────────────

export function getEventShareUrl(eventId: string, token?: string): string {
  const base = `${process.env.NEXT_PUBLIC_APP_URL}/evento/${eventId}`;
  return token ? `${base}?inv=${token}` : base;
}

// ─── Capacidad ───────────────────────────────────────────────

export function getPorcentajeCapacidad(asistentes: number, capacidad?: number | null): number {
  if (!capacidad) return 0;
  return Math.min(100, Math.round((asistentes / capacidad) * 100));
}

export function getCapacidadLabel(asistentes: number, capacidad?: number | null): string {
  if (!capacidad) return `${asistentes} confirmados`;
  const disponibles = capacidad - asistentes;
  if (disponibles <= 0) return "Lleno";
  if (disponibles <= 5) return `¡Solo quedan ${disponibles}!`;
  return `${asistentes} / ${capacidad}`;
}
