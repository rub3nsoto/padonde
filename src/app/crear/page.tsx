"use client";
// Wizard de creación/edición de evento en 8 pasos
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import {
  Check, ChevronRight, ChevronLeft, Loader2,
  Type, Calendar, MapPin, Users, Lock, Settings,
  Image as ImageIcon, Eye
} from "lucide-react";
import type { CreateEventFormData, EventType, PrivacyType } from "@/types";
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS, TIMEZONES } from "@/types";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const EventMap = dynamic(() => import("@/components/maps/EventMap"), { ssr: false });

// ─── Steps config ─────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Info básica",  icon: Type },
  { id: 2, label: "Fecha",        icon: Calendar },
  { id: 3, label: "Ubicación",    icon: MapPin },
  { id: 4, label: "Capacidad",    icon: Users },
  { id: 5, label: "Privacidad",   icon: Lock },
  { id: 6, label: "Detalles",     icon: Settings },
  { id: 7, label: "Fotos",        icon: ImageIcon },
  { id: 8, label: "Publicar",     icon: Eye },
];

const EVENT_TYPES: EventType[] = ["PARTY", "CONCERT", "SPORT", "AFTERPARTY", "NETWORKING", "CULTURAL", "OTHER"];

const PRIVACY_OPTIONS = [
  {
    value:   "PUBLIC" as PrivacyType,
    label:   "Público",
    desc:    "Visible para todos los usuarios de Eventure.",
    icon:    "🌐",
  },
  {
    value:   "LINK" as PrivacyType,
    label:   "Privado por link",
    desc:    "Solo accesible con el link único que recibirás.",
    icon:    "🔗",
  },
  {
    value:   "APPROVAL" as PrivacyType,
    label:   "Por aprobación",
    desc:    "Los asistentes deben solicitar y tú apruebas cada uno.",
    icon:    "✋",
  },
];

// ─── Formulario principal ─────────────────────────────────────

const INITIAL_DATA: Partial<CreateEventFormData> = {
  tipo:        "PARTY",
  tags:        [],
  zonaHoraria: "America/Mexico_City",
  privacidad:  "PUBLIC",
  moneda:      "MXN",
  sinLimite:   false,
  aceptarSolicitudesCuandoLleno: false,
};

export default function CrearEventoPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const editId        = searchParams.get("edit"); // si existe, estamos editando
  const { isSignedIn } = useUser();
  const [step, setStep]     = useState(1);
  const [profileChecked, setProfileChecked] = useState(false);
  const [editLoaded, setEditLoaded]         = useState(!editId); // true si no hay edit
  const [data, setData]     = useState<Partial<CreateEventFormData & { sinLimite: boolean; media: File[] }>>(INITIAL_DATA);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tagInput, setTagInput]   = useState("");
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string }[]>([]);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [suggestions, setSuggestions]       = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notaCambios, setNotaCambios] = useState("");
  const [currentAttendees, setCurrentAttendees] = useState(0);
  const [showCapacityConfirm, setShowCapacityConfirm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verificar que el usuario tenga perfil en la BD
  useEffect(() => {
    if (!isSignedIn || profileChecked) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        setProfileChecked(true);
        if (d.error === "Usuario no encontrado") {
          router.replace("/auth/registro?step=perfil&redirect=/crear");
        }
      })
      .catch(() => setProfileChecked(true));
  }, [isSignedIn, profileChecked, router]);

  // Cargar datos del evento si estamos en modo edición
  useEffect(() => {
    if (!editId || !isSignedIn) return;
    fetch(`/api/events/${editId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const e = d.data;
          // Convertir ISO a formato datetime-local (YYYY-MM-DDTHH:mm)
          const toLocal = (iso: string) => {
            const dt = new Date(iso);
            return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          };
          setCurrentAttendees(e.asistentesCount || 0);
          setData({
            nombre:           e.nombre,
            descripcion:      e.descripcion,
            tipo:             e.tipo,
            tags:             e.tags || [],
            fechaInicio:      toLocal(e.fechaInicio),
            fechaFin:         toLocal(e.fechaFin),
            zonaHoraria:      e.zonaHoraria,
            direccion:        e.direccion,
            ciudad:           e.ciudad,
            lat:              e.lat,
            lng:              e.lng,
            capacidadMaxima:  e.capacidadMaxima || undefined,
            sinLimite:        !e.capacidadMaxima,
            aceptarSolicitudesCuandoLleno: e.aceptarSolicitudesCuandoLleno || false,
            privacidad:       e.privacidad,
            codigoVestimenta: e.codigoVestimenta || "",
            precio:           e.precio || undefined,
            moneda:           e.moneda || "MXN",
            instrucciones:    e.instrucciones || "",
          });
        }
        setEditLoaded(true);
      })
      .catch(() => setEditLoaded(true));
  }, [editId, isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-lg mb-4">Inicia sesión para crear un evento</p>
          <a href="/auth/login" className="btn-primary">Iniciar sesión</a>
        </div>
      </div>
    );
  }

  if (!editLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  const update = (fields: Partial<typeof data>) => setData((d) => ({ ...d, ...fields }));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !data.tags?.includes(tag) && (data.tags?.length || 0) < 10) {
      update({ tags: [...(data.tags || []), tag] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) =>
    update({ tags: data.tags?.filter((t) => t !== tag) });

  // Geocoding con Nominatim (OpenStreetMap) — gratuito, sin API key
  const geocodeAddress = async (address: string) => {
    if (!address) return;
    setGeocodeLoading(true);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const json = await res.json();
      const result = json[0];
      if (result) {
        update({
          lat:      parseFloat(result.lat),
          lng:      parseFloat(result.lon),
          direccion: result.display_name,
          ciudad:   result.address?.city || result.address?.town || result.address?.state || "",
        });
      } else {
        toast.error("Dirección no encontrada. Intenta ser más específico.");
      }
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleAddressChange = (value: string) => {
    update({ direccion: value });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "es" } }
        );
        const json = await res.json();
        setSuggestions(json);
        setShowSuggestions(json.length > 0);
      } catch { setSuggestions([]); }
    }, 400);
  };

  const selectSuggestion = (s: any) => {
    update({
      lat:      parseFloat(s.lat),
      lng:      parseFloat(s.lon),
      direccion: s.display_name,
      ciudad:   s.address?.city || s.address?.town || s.address?.municipality || s.address?.state || "",
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMediaAdd = (files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    const newFiles = allowed.slice(0, 12 - mediaFiles.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const needsCapacityConfirm =
    !!editId &&
    !data.sinLimite &&
    !!data.capacidadMaxima &&
    currentAttendees > 0 &&
    data.capacidadMaxima < currentAttendees;

  const handlePublish = async () => {
    // Si hay reducción de capacidad, pedir confirmación primero
    if (needsCapacityConfirm && !showCapacityConfirm) {
      setShowCapacityConfirm(true);
      return;
    }
    setShowCapacityConfirm(false);
    setPublishing(true);
    try {
      const payload = {
        nombre:           data.nombre,
        descripcion:      data.descripcion,
        tipo:             data.tipo,
        tags:             data.tags,
        fechaInicio:      data.fechaInicio ? new Date(data.fechaInicio).toISOString() : undefined,
        fechaFin:         data.fechaFin    ? new Date(data.fechaFin).toISOString()    : undefined,
        zonaHoraria:      data.zonaHoraria,
        direccion:        data.direccion,
        ciudad:           data.ciudad,
        lat:              data.lat,
        lng:              data.lng,
        capacidadMaxima:  data.sinLimite ? undefined : data.capacidadMaxima,
        aceptarSolicitudesCuandoLleno: !data.sinLimite ? (data.aceptarSolicitudesCuandoLleno ?? false) : false,
        privacidad:       data.privacidad,
        codigoVestimenta: data.codigoVestimenta,
        precio:           data.precio,
        moneda:           data.moneda,
        instrucciones:    data.instrucciones,
        ...(editId ? { notaCambios } : {}),
      };

      const res = await fetch(editId ? `/api/events/${editId}` : "/api/events", {
        method:  editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        const details = err.details?.fieldErrors
          ? Object.entries(err.details.fieldErrors)
              .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
              .join(" | ")
          : "";
        toast.error(details || err.error || (editId ? "Error al actualizar" : "Error al crear el evento"), { duration: 6000 });
        return;
      }

      const { data: evento } = await res.json();
      const eventoId = editId || evento.id;

      // Subir media nueva si la hay (solo en modo creación; en edición se podría extender)
      if (!editId && mediaFiles.length > 0) {
        setUploading(true);
        for (let i = 0; i < mediaFiles.length; i++) {
          const fd = new FormData();
          fd.append("file", mediaFiles[i].file);
          fd.append("eventId", eventoId);
          fd.append("orden", String(i));
          await fetch("/api/upload", { method: "POST", body: fd });
        }
        setUploading(false);
      }

      toast.success(editId ? "¡Evento actualizado! Se notificó a los asistentes." : "¡Evento publicado con éxito!");
      router.push(`/evento/${eventoId}`);
    } catch {
      toast.error("Error inesperado");
    } finally {
      setPublishing(false);
    }
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!(data.nombre && data.descripcion && data.descripcion.length >= 10 && data.tipo);
      case 2: return !!(data.fechaInicio && data.fechaFin);
      case 3: return !!(data.lat && data.lng && data.direccion && data.ciudad && data.ciudad.length >= 2);
      case 4: return !!(data.sinLimite || data.capacidadMaxima);
      case 5: return !!data.privacidad;
      default: return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{editId ? "Editar evento" : "Crear evento"}</h1>
        <p className="text-gray-400 mt-1">
          Paso {step} de {STEPS.length} — {STEPS[step - 1].label}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all",
                s.id === step
                  ? "border-brand-500 bg-brand-500/20 text-brand-400"
                  : s.id < step
                  ? "border-green-500 bg-green-500/10 text-green-400 cursor-pointer hover:bg-green-500/20"
                  : "border-surface-400 bg-surface-700 text-gray-600 cursor-not-allowed"
              )}
            >
              {s.id < step ? <Check className="w-4 h-4" /> : s.id}
            </button>
            {s.id < STEPS.length && (
              <div className={cn("w-6 h-0.5 rounded", s.id < step ? "bg-green-500" : "bg-surface-500")} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="card p-6"
        >
          {/* ── STEP 1: Info básica ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="label">Nombre del evento *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Rooftop Techno Night CDMX"
                  value={data.nombre || ""}
                  onChange={(e) => update({ nombre: e.target.value })}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="label">Descripción *</label>
                <textarea
                  className="input min-h-32 resize-none"
                  placeholder="Describe tu evento: qué va a pasar, qué esperar, qué incluye..."
                  value={data.descripcion || ""}
                  onChange={(e) => update({ descripcion: e.target.value })}
                  maxLength={2000}
                  rows={5}
                />
                <div className="flex justify-between mt-1">
                  {(data.descripcion || "").length < 10 && (
                    <p className="text-xs text-amber-600">Mínimo 10 caracteres</p>
                  )}
                  <p className="text-xs text-gray-600 ml-auto">{(data.descripcion || "").length}/2000</p>
                </div>
              </div>

              <div>
                <label className="label">Tipo de evento *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EVENT_TYPES.map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => update({ tipo })}
                      className={cn(
                        "flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all",
                        data.tipo === tipo
                          ? "border-brand-500 bg-brand-500/10 text-brand-400"
                          : "border-surface-400 bg-surface-600 text-gray-400 hover:border-surface-300"
                      )}
                    >
                      <span>{EVENT_TYPE_EMOJIS[tipo]}</span>
                      {EVENT_TYPE_LABELS[tipo]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Etiquetas (max 10)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="techno, rooftop, free..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    maxLength={30}
                  />
                  <button onClick={addTag} className="btn-secondary px-4">Agregar</button>
                </div>
                {data.tags && data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.tags.map((tag) => (
                      <span key={tag} className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Fecha y hora ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="label">Fecha y hora de inicio *</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={data.fechaInicio || ""}
                  onChange={(e) => update({ fechaInicio: e.target.value })}
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="label">Fecha y hora de fin *</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={data.fechaFin || ""}
                  onChange={(e) => update({ fechaFin: e.target.value })}
                  min={data.fechaInicio || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="label">Zona horaria</label>
                <select
                  className="input"
                  value={data.zonaHoraria}
                  onChange={(e) => update({ zonaHoraria: e.target.value })}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 3: Ubicación ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="relative">
                <label className="label">Dirección *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Insurgentes Sur 1234, Roma Norte, CDMX"
                  value={data.direccion || ""}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                />
                {showSuggestions && (
                  <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-surface-500 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        onMouseDown={() => selectSuggestion(s)}
                        className="px-4 py-3 text-sm text-gray-700 hover:bg-surface-600 cursor-pointer border-b border-surface-500 last:border-0 leading-snug"
                      >
                        <span className="font-medium text-gray-900">
                          {s.address?.road || s.address?.amenity || s.name || ""}
                          {(s.address?.road || s.address?.amenity || s.name) && ", "}
                        </span>
                        {s.address?.city || s.address?.town || s.address?.municipality || ""}
                        {(s.address?.city || s.address?.town || s.address?.municipality) && ", "}
                        {s.address?.country || ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="label">Ciudad *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ciudad de México"
                  value={data.ciudad || ""}
                  onChange={(e) => update({ ciudad: e.target.value })}
                  required
                />
                {(!data.ciudad || data.ciudad.length < 2) && (
                  <p className="text-xs text-amber-600 mt-1">Ingresa la ciudad para continuar</p>
                )}
              </div>

              {/* Mapa de selección */}
              <div>
                <label className="label">O haz clic en el mapa para seleccionar</label>
                <div className="h-64 rounded-xl overflow-hidden">
                  <EventMap
                    events={[]}
                    center={data.lat && data.lng ? [data.lat, data.lng] : [19.432, -99.133]}
                    zoom={data.lat ? 15 : 11}
                    selectionMode
                    selectedLat={data.lat}
                    selectedLng={data.lng}
                    onLocationSelect={(lat, lng) => update({ lat, lng })}
                    className="w-full h-full"
                  />
                </div>
                {data.lat && data.lng && (
                  <p className="text-xs text-gray-500 mt-2">
                    📍 {data.lat.toFixed(6)}, {data.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: Capacidad ── */}
          {step === 4 && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => update({ sinLimite: !data.sinLimite })}
                  className={cn(
                    "w-10 h-6 rounded-full border-2 relative transition-all cursor-pointer",
                    data.sinLimite ? "bg-brand-500 border-brand-500" : "bg-surface-600 border-surface-400"
                  )}
                >
                  <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform", data.sinLimite ? "translate-x-4" : "translate-x-0.5")} />
                </div>
                <span className="text-gray-900 font-medium">Sin límite de asistentes</span>
              </label>

              {!data.sinLimite && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Capacidad máxima *</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="Ej. 150"
                      value={data.capacidadMaxima || ""}
                      onChange={(e) => update({ capacidadMaxima: parseInt(e.target.value) || undefined })}
                      min={1}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Incluye a los asistentes confirmados y con pago.
                    </p>
                    {editId && currentAttendees > 0 && data.capacidadMaxima && data.capacidadMaxima < currentAttendees && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-1">
                        <p className="font-semibold">⚠️ Se reducirá la lista de asistentes</p>
                        <p>
                          Se cancelará la asistencia de los últimos{" "}
                          <strong>{currentAttendees - data.capacidadMaxima}</strong> en registrarse
                          y recibirán una notificación.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Lista de espera */}
                  <div className="p-4 bg-surface-700 border border-surface-500 rounded-xl space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => update({ aceptarSolicitudesCuandoLleno: !data.aceptarSolicitudesCuandoLleno })}
                        className={cn(
                          "w-10 h-6 rounded-full border-2 relative transition-all cursor-pointer flex-shrink-0",
                          data.aceptarSolicitudesCuandoLleno ? "bg-brand-500 border-brand-500" : "bg-surface-600 border-surface-400"
                        )}
                      >
                        <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform", data.aceptarSolicitudesCuandoLleno ? "translate-x-4" : "translate-x-0.5")} />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium text-sm">Aceptar solicitudes cuando el evento esté lleno</p>
                        <p className="text-gray-500 text-xs mt-0.5">Los interesados quedarán en lista de espera (pendientes) y tú decides quién entra si hay cancelaciones.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: Privacidad ── */}
          {step === 5 && (
            <div className="space-y-3">
              {PRIVACY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ privacidad: opt.value })}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                    data.privacidad === opt.value
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-surface-400 bg-surface-600 hover:border-surface-300"
                  )}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className={cn("font-semibold", data.privacidad === opt.value ? "text-brand-500" : "text-gray-900")}>
                      {opt.label}
                    </p>
                    <p className="text-gray-400 text-sm mt-0.5">{opt.desc}</p>
                  </div>
                  {data.privacidad === opt.value && (
                    <Check className="w-5 h-5 text-brand-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── STEP 6: Detalles extra ── */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <label className="label">Precio (dejar vacío si es gratis)</label>
                <div className="flex gap-2">
                  <select
                    className="input w-24 flex-shrink-0"
                    value={data.moneda}
                    onChange={(e) => update({ moneda: e.target.value })}
                  >
                    {["MXN", "USD", "COP", "CLP", "ARS", "EUR"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input flex-1"
                    placeholder="0 = gratis"
                    value={data.precio || ""}
                    onChange={(e) => update({ precio: parseFloat(e.target.value) || undefined })}
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="label">Código de vestimenta</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Negro obligatorio, casual elegante..."
                  value={data.codigoVestimenta || ""}
                  onChange={(e) => update({ codigoVestimenta: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Instrucciones especiales</label>
                <textarea
                  className="input resize-none"
                  placeholder="Ej. Llegar puntual, traer identificación..."
                  value={data.instrucciones || ""}
                  onChange={(e) => update({ instrucciones: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* ── STEP 7: Media ── */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <label className="label">
                  Fotos y videos (hasta 10 fotos + 2 videos)
                </label>
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-surface-400 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-500/5 transition-all">
                  <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">Arrastra archivos o haz clic para subir</p>
                  <p className="text-gray-600 text-xs mt-1">JPG, PNG, MP4 • Máx 100MB por archivo</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleMediaAdd(e.target.files)}
                  />
                </label>
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {mediaFiles.map((m, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-600">
                      {m.file.type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-2xl">🎬</span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          URL.revokeObjectURL(m.preview);
                          setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 8: Revisión y publicación ── */}
          {step === 8 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">Resumen del evento</h3>

              <div className="space-y-3 text-sm">
                {[
                  ["Nombre",       data.nombre],
                  ["Tipo",         `${EVENT_TYPE_EMOJIS[data.tipo as EventType]} ${EVENT_TYPE_LABELS[data.tipo as EventType]}`],
                  ["Inicio",       data.fechaInicio ? new Date(data.fechaInicio).toLocaleString("es-MX") : "—"],
                  ["Fin",          data.fechaFin ? new Date(data.fechaFin).toLocaleString("es-MX") : "—"],
                  ["Dirección",    data.direccion],
                  ["Capacidad",    data.sinLimite ? "Ilimitada" : `${data.capacidadMaxima || "—"}${!data.sinLimite && data.aceptarSolicitudesCuandoLleno ? " + lista de espera" : ""}`],
                  ["Privacidad",   data.privacidad],
                  ["Precio",       data.precio ? `${data.moneda} ${data.precio}` : "Gratis"],
                  ["Vestimenta",   data.codigoVestimenta || "Sin código"],
                  ["Media",        `${mediaFiles.length} archivos`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-900 font-medium text-right max-w-[200px]">{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Nota de cambios para asistentes (solo en modo edición) */}
              {editId && (
                <div>
                  <label className="label">Nota para los asistentes (opcional)</label>
                  <textarea
                    className="input resize-none"
                    placeholder="Ej. Se cambió la hora de inicio a las 21:00, la dirección sigue siendo la misma..."
                    value={notaCambios}
                    onChange={(e) => setNotaCambios(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">Se enviará una notificación a todos los asistentes con este mensaje.</p>
                </div>
              )}

              {/* Aviso legal OBLIGATORIO */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 leading-relaxed">
                Al publicar este evento, confirmas que:<br/>
                • Tienes 18 años o más.<br/>
                • El evento es legal y cumple con la normativa local.<br/>
                • Eres el único responsable de su organización, seguridad e incidentes.<br/>
                • Eventure es un intermediario tecnológico sin responsabilidad sobre el evento.<br/>
                • Has leído y aceptas los{" "}
                <a href="/legal/terminos" target="_blank" className="underline">Términos y Condiciones</a>.
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navegación entre pasos */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-secondary disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        {step < STEPS.length ? (
          <button
            onClick={() => { if (canNext()) setStep((s) => s + 1); }}
            disabled={!canNext()}
            className="btn-primary disabled:opacity-40"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : showCapacityConfirm ? (
            <div className="flex flex-col items-end gap-2">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-right max-w-xs">
                <p className="font-semibold mb-1">¿Confirmar reducción?</p>
                <p>
                  Se cancelará la asistencia de los últimos{" "}
                  <strong>{currentAttendees - (data.capacidadMaxima || 0)}</strong> en registrarse.
                  Recibirán una notificación explicando el cambio.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCapacityConfirm(false)}
                  className="btn-secondary text-sm py-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="btn-primary text-sm py-2 bg-red-500 hover:bg-red-600 border-red-500"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, confirmar"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || uploading}
              className="btn-primary px-8"
            >
              {publishing || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? "Subiendo media..." : editId ? "Guardando..." : "Publicando..."}
                </>
              ) : (
                <>{editId ? "💾 Guardar cambios" : "🚀 Publicar evento"}</>
              )}
            </button>
        )}
      </div>
    </div>
  );
}
