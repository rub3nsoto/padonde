"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Check } from "lucide-react";
import type { ExploreFilters, EventType } from "@/types";
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS } from "@/types";
import { cn } from "@/lib/utils";

const EVENT_TYPES: EventType[] = ["PARTY", "CONCERT", "SPORT", "AFTERPARTY", "NETWORKING", "CULTURAL", "OTHER"];

const FECHA_OPTIONS = [
  { value: "today",   label: "Hoy" },
  { value: "weekend", label: "Este fin de semana" },
  { value: "week",    label: "Esta semana" },
  { value: "month",   label: "Este mes" },
];

const PRECIO_OPTIONS = [
  { value: "free", label: "Gratis" },
  { value: "paid", label: "De pago" },
];

const DISTANCIA_OPTIONS = [
  { value: 5,   label: "5 km" },
  { value: 10,  label: "10 km" },
  { value: 25,  label: "25 km" },
  { value: 50,  label: "50 km" },
  { value: 100, label: "100 km" },
];

interface Props {
  filters:  ExploreFilters;
  onChange: (filters: ExploreFilters) => void;
}

// Cuenta filtros activos aplicados (excluye ciudad — se maneja desde el buscador)
function countActive(f: ExploreFilters) {
  return [f.tipo, f.fecha, f.precio, f.distanciaKm, f.soloDisponibles].filter(Boolean).length;
}

export default function EventFilters({ filters, onChange }: Props) {
  const [open, setOpen]     = useState(false);
  const [draft, setDraft]   = useState<ExploreFilters>(filters);

  // Sincronizar draft cuando se abre el panel
  const handleOpen = () => {
    setDraft(filters);
    setOpen(true);
  };

  const apply = () => {
    // Preservar ciudad ya que la maneja el buscador
    onChange({ ...draft, ciudad: filters.ciudad });
    setOpen(false);
  };

  const reset = () => {
    const cleared = { ciudad: filters.ciudad }; // mantener ciudad activa
    setDraft(cleared);
    onChange(cleared);
  };

  const set = <K extends keyof ExploreFilters>(k: K, v: ExploreFilters[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const toggle = <K extends keyof ExploreFilters>(k: K, v: ExploreFilters[K]) =>
    setDraft((d) => ({ ...d, [k]: d[k] === v ? undefined : v }));

  const activeCount   = countActive(filters);
  const draftCount    = countActive(draft);
  const hasChanges    = JSON.stringify(draft) !== JSON.stringify({ ...filters, ciudad: undefined });

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
          open || activeCount > 0
            ? "border-brand-500 text-brand-600 bg-brand-500/10"
            : "border-surface-500 text-gray-600 bg-white hover:border-gray-400 hover:text-gray-900"
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtros
        {activeCount > 0 && (
          <span className="w-5 h-5 bg-brand-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-12 z-50 w-80 bg-white border border-surface-500 rounded-2xl shadow-card-hover p-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Filtros</h3>
                <div className="flex items-center gap-3">
                  {activeCount > 0 && (
                    <button
                      onClick={reset}
                      className="text-xs text-gray-500 hover:text-brand-500 transition-colors font-medium"
                    >
                      Limpiar todo
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tipo de evento */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tipo de evento</p>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => toggle("tipo", tipo)}
                      className={cn(
                        "badge text-xs py-1.5 px-3 cursor-pointer transition-all border",
                        draft.tipo === tipo
                          ? "bg-brand-500/10 text-brand-600 border-brand-500/40 font-semibold"
                          : "bg-surface-700 text-gray-700 border-surface-500 hover:border-gray-400 hover:text-gray-900"
                      )}
                    >
                      {EVENT_TYPE_EMOJIS[tipo]} {EVENT_TYPE_LABELS[tipo]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fecha</p>
                <div className="grid grid-cols-2 gap-2">
                  {FECHA_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggle("fecha", opt.value as any)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                        draft.fecha === opt.value
                          ? "border-brand-500 bg-brand-500/10 text-brand-600 font-semibold"
                          : "border-surface-500 bg-surface-700 text-gray-700 hover:border-gray-400 hover:text-gray-900"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Precio</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRECIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggle("precio", opt.value as any)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                        draft.precio === opt.value
                          ? "border-brand-500 bg-brand-500/10 text-brand-600 font-semibold"
                          : "border-surface-500 bg-surface-700 text-gray-700 hover:border-gray-400 hover:text-gray-900"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distancia */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Radio de distancia</p>
                <div className="flex flex-wrap gap-2">
                  {DISTANCIA_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggle("distanciaKm", opt.value)}
                      className={cn(
                        "badge text-xs py-1.5 px-3 cursor-pointer border transition-all",
                        draft.distanciaKm === opt.value
                          ? "border-brand-500 bg-brand-500/10 text-brand-600 font-semibold"
                          : "border-surface-500 bg-surface-700 text-gray-700 hover:border-gray-400"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solo disponibles */}
              <div className="mb-5">
                <label
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => set("soloDisponibles", !draft.soloDisponibles)}
                >
                  <div className={cn(
                    "w-10 h-6 rounded-full border-2 relative transition-all flex-shrink-0",
                    draft.soloDisponibles ? "bg-brand-500 border-brand-500" : "bg-surface-600 border-surface-500"
                  )}>
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm",
                      draft.soloDisponibles ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Solo con lugares disponibles</span>
                </label>
              </div>

              {/* ─── Botón Aplicar ─── */}
              <div className="flex gap-2 pt-1 border-t border-surface-500">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 btn-secondary py-2.5 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={apply}
                  className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Aplicar{draftCount > 0 ? ` (${draftCount})` : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
