// ──────────────────────────────────────────────────────────────
// TIPOS GLOBALES DE EVENTURE
// Estos tipos son la fuente de verdad para todo el frontend.
// Los tipos del ORM (Prisma) se usan en el backend directamente.
// ──────────────────────────────────────────────────────────────

export type EventType =
  | "PARTY"
  | "CONCERT"
  | "SPORT"
  | "AFTERPARTY"
  | "NETWORKING"
  | "CULTURAL"
  | "OTHER";

export type PrivacyType = "PUBLIC" | "LINK" | "APPROVAL";

export type EventStatus = "DRAFT" | "ACTIVE" | "CANCELLED" | "FINISHED";

export type AttendanceStatus =
  | "CONFIRMED"
  | "PENDING"
  | "REJECTED"
  | "RESERVED"
  | "CANCELLED";

export type MediaType = "PHOTO" | "VIDEO";

// ─── Usuario ───────────────────────────────────────────────────

export interface User {
  id: string;
  clerkId: string;
  email: string;
  nombre: string;
  fechaNacimiento: string; // ISO string
  foto?: string;
  bio?: string;
  verificadoEdad: boolean;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  clerkId?: string;
  nombre: string;
  foto?: string;
  bio?: string;
  createdAt: string;
  _count?: {
    eventosCreados: number;
    asistencias: number;
  };
}

// ─── Evento ───────────────────────────────────────────────────

export interface EventMedia {
  id: string;
  url: string;
  publicId: string;
  tipo: MediaType;
  orden: number;
}

export interface Event {
  id: string;
  creatorId: string;
  creator: UserPublic;
  nombre: string;
  descripcion: string;
  tipo: EventType;
  tags: string[];
  fechaInicio: string;
  fechaFin: string;
  zonaHoraria: string;
  direccion: string;
  ciudad: string;
  lat: number;
  lng: number;
  capacidadMaxima?: number;
  privacidad: PrivacyType;
  codigoVestimenta?: string;
  precio?: number;
  moneda: string;
  instrucciones?: string;
  aceptarSolicitudesCuandoLleno: boolean;
  estado: EventStatus;
  vistas: number;
  linkUnico?: string;
  media: EventMedia[];
  createdAt: string;
  // Virtuales (calculados en API)
  asistentesCount?: number;
  userAttendance?: AttendanceStatus;
  disponible?: boolean; // hay lugares disponibles
}

// ─── Asistencia ───────────────────────────────────────────────

export interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  estado: AttendanceStatus;
  createdAt: string;
  user?: UserPublic;
  event?: Partial<Event>;
}

// ─── Notificación ─────────────────────────────────────────────

export type NotificationType =
  | "ATTENDANCE_CONFIRMED"
  | "ATTENDANCE_APPROVED"
  | "ATTENDANCE_REJECTED"
  | "EVENT_REMINDER"
  | "EVENT_CANCELLED"
  | "EVENT_UPDATED"
  | "NEW_NEARBY_EVENT"
  | "INVITATION_RECEIVED";

export interface Notification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  eventId?: string;
  event?: Partial<Event>;
  createdAt: string;
}

// ─── Filtros de exploración ───────────────────────────────────

export interface ExploreFilters {
  tipo?: EventType;
  fecha?: "today" | "weekend" | "week" | "month";
  precio?: "free" | "paid";
  precioMin?: number;
  precioMax?: number;
  distanciaKm?: number;
  soloDisponibles?: boolean;
  lat?: number;
  lng?: number;
  ciudad?: string;
}

// ─── Formulario de creación de evento ─────────────────────────

export interface CreateEventStep1 {
  nombre: string;
  descripcion: string;
  tipo: EventType;
  tags: string[];
}

export interface CreateEventStep2 {
  fechaInicio: string;
  fechaFin: string;
  zonaHoraria: string;
}

export interface CreateEventStep3 {
  direccion: string;
  ciudad: string;
  lat: number;
  lng: number;
}

export interface CreateEventStep4 {
  capacidadMaxima?: number;
  sinLimite: boolean;
  aceptarSolicitudesCuandoLleno: boolean;
}

export interface CreateEventStep5 {
  privacidad: PrivacyType;
}

export interface CreateEventStep6 {
  codigoVestimenta?: string;
  precio?: number;
  moneda?: string;
  instrucciones?: string;
}

export interface CreateEventStep7 {
  media: File[];
}

export interface CreateEventFormData
  extends CreateEventStep1,
    CreateEventStep2,
    CreateEventStep3,
    CreateEventStep4,
    CreateEventStep5,
    CreateEventStep6 {}

// ─── Respuestas de API ────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  PARTY:       "Fiesta",
  CONCERT:     "Concierto",
  SPORT:       "Deporte",
  AFTERPARTY:  "Afterparty",
  NETWORKING:  "Networking",
  CULTURAL:    "Cultural",
  OTHER:       "Otro",
};

export const EVENT_TYPE_EMOJIS: Record<EventType, string> = {
  PARTY:       "🎉",
  CONCERT:     "🎵",
  SPORT:       "⚽",
  AFTERPARTY:  "🌙",
  NETWORKING:  "🤝",
  CULTURAL:    "🎭",
  OTHER:       "✨",
};

export const PRIVACY_LABELS: Record<PrivacyType, string> = {
  PUBLIC:   "Público",
  LINK:     "Privado (solo con link)",
  APPROVAL: "Privado (por aprobación)",
};

export const TIMEZONES = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Monterrey", label: "Monterrey (GMT-6)" },
  { value: "America/Tijuana", label: "Tijuana (GMT-7)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
];
