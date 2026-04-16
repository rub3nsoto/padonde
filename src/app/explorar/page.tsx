"use client";
// Página de exploración — mapa + lista de eventos con filtros
import { useState, useEffect, useCallback, useRef } from "react";
import { Map, List, Search, Loader2, X, MapPin, Calendar } from "lucide-react";
import type { Event, ExploreFilters } from "@/types";
import EventCard, { EventCardSkeleton } from "@/components/events/EventCard";
import EventFilters from "@/components/events/EventFilters";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Importar mapa dinámicamente (solo cliente, evita SSR de mapbox)
const EventMap = dynamic(() => import("@/components/maps/EventMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-800 rounded-2xl skeleton" />
  ),
});

type ViewMode = "split" | "map" | "list";

interface Suggestion {
  type: "event" | "city" | "tag";
  label: string;
  sublabel?: string;
  value: string;
}

export default function ExplorarPage() {
  const [events, setEvents]         = useState<Event[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState<ExploreFilters>({});
  const [search, setSearch]         = useState("");
  const [viewMode, setViewMode]     = useState<ViewMode>("split");
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [userPos, setUserPos]       = useState<{ lat: number; lng: number } | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions]         = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggLoading, setSuggLoading]         = useState(false);
  const [activeIdx, setActiveIdx]             = useState(-1);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef    = useRef<HTMLDivElement>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silenciar error si rechaza
    );
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch de sugerencias con debounce
  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggLoading(true);
    try {
      const res  = await fetch(`/api/events?q=${encodeURIComponent(text)}&pageSize=8`);
      const data = await res.json();
      const items: Event[] = data.data || [];

      const result: Suggestion[] = [];

      // Ciudades únicas que contienen el texto
      const ciudades = Array.from(new Set(
        items
          .map((e) => e.ciudad)
          .filter((c) => c.toLowerCase().includes(text.toLowerCase()))
      )).slice(0, 3);
      ciudades.forEach((c) => result.push({ type: "city", label: c, value: c }));

      // Eventos que coinciden con el nombre
      items
        .filter((e) => e.nombre.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 5)
        .forEach((e) => result.push({
          type: "event",
          label: e.nombre,
          sublabel: e.ciudad,
          value: e.nombre,
        }));

      // Tags únicos que coinciden
      const allTags = items.flatMap((e) => e.tags || []);
      const matchingTags = Array.from(new Set(
        allTags.filter((t) => t.toLowerCase().includes(text.toLowerCase()))
      )).slice(0, 2);
      matchingTags.forEach((t) => result.push({ type: "tag", label: `#${t}`, value: t }));

      setSuggestions(result);
      setShowSuggestions(result.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
    if (!value.trim()) { setSuggestions([]); setShowSuggestions(false); }
  };

  const applySuggestion = (s: Suggestion) => {
    if (s.type === "city") {
      setFilters((f) => ({ ...f, ciudad: s.value }));
      setSearch("");
    } else {
      setSearch(s.value);
    }
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIdx(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      applySuggestion(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIdx(-1);
    }
  };

  const fetchEvents = useCallback(async (reset = true) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    if (reset) setPage(1);

    const params = new URLSearchParams();
    if (filters.tipo)            params.set("tipo", filters.tipo);
    if (filters.fecha)           params.set("fecha", filters.fecha);
    if (filters.precio)          params.set("precio", filters.precio);
    if (filters.soloDisponibles) params.set("disponibles", "true");
    if (filters.ciudad)          params.set("ciudad", filters.ciudad);
    // Solo aplicar filtro de distancia si el usuario lo activó explícitamente
    if (filters.distanciaKm && userPos) {
      params.set("distancia", String(filters.distanciaKm));
      params.set("lat", String(userPos.lat));
      params.set("lng", String(userPos.lng));
    }
    if (search) params.set("q", search);
    params.set("page", String(currentPage));
    params.set("pageSize", "24");

    try {
      const res  = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(reset ? data.data : (prev) => [...prev, ...data.data]);
      setHasMore(data.hasMore);
    } catch {
      // manejar error
    } finally {
      setLoading(false);
    }
  }, [filters, search, userPos, page]);

  useEffect(() => { fetchEvents(true); }, [filters, search, userPos]);

  const loadMore = () => {
    setPage((p) => p + 1);
    fetchEvents(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* ─── Barra de búsqueda y controles ─── */}
      <div className="relative z-[1100] bg-white border-b border-surface-500 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          {/* Buscador con autocomplete */}
          <div ref={searchRef} className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Buscar eventos, ciudades, tipos..."
              className="input pl-9 pr-8 py-2.5 text-sm"
              autoComplete="off"
            />
            {/* Limpiar búsqueda */}
            {search && (
              <button
                onClick={() => { setSearch(""); setSuggestions([]); setShowSuggestions(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Spinner de sugerencias */}
            {suggLoading && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />
            )}

            {/* Dropdown de sugerencias */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-surface-500 rounded-xl shadow-card-hover z-[9999] overflow-hidden">
                {/* Ciudades */}
                {suggestions.some((s) => s.type === "city") && (
                  <div>
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Ciudades
                    </p>
                    {suggestions.filter((s) => s.type === "city").map((s, i) => (
                      <button
                        key={`city-${i}`}
                        onMouseDown={() => applySuggestion(s)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          activeIdx === suggestions.indexOf(s) ? "bg-surface-600" : "hover:bg-surface-700"
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.label}</p>
                          <p className="text-xs text-gray-500">Ver eventos en {s.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Eventos */}
                {suggestions.some((s) => s.type === "event") && (
                  <div>
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Eventos
                    </p>
                    {suggestions.filter((s) => s.type === "event").map((s, i) => (
                      <button
                        key={`event-${i}`}
                        onMouseDown={() => applySuggestion(s)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          activeIdx === suggestions.indexOf(s) ? "bg-surface-600" : "hover:bg-surface-700"
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-brand-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.label}</p>
                          {s.sublabel && <p className="text-xs text-gray-500">{s.sublabel}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {suggestions.some((s) => s.type === "tag") && (
                  <div className="border-t border-surface-500">
                    <div className="flex flex-wrap gap-2 px-3 py-2.5">
                      {suggestions.filter((s) => s.type === "tag").map((s, i) => (
                        <button
                          key={`tag-${i}`}
                          onMouseDown={() => applySuggestion(s)}
                          className="px-3 py-1 rounded-full bg-surface-600 hover:bg-surface-500 text-xs font-medium text-gray-700 transition-colors border border-surface-500"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filtros */}
          <EventFilters filters={filters} onChange={setFilters} />

          {/* Toggle de vista — solo desktop */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-600 border border-surface-500 rounded-xl p-1">
            {(["split", "map", "list"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === mode
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-gray-500 hover:text-gray-900"
                )}
                title={mode === "split" ? "Vista dividida" : mode === "map" ? "Solo mapa" : "Solo lista"}
              >
                {mode === "map" ? <Map className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Chip de ciudad activa */}
        {filters.ciudad && (
          <div className="max-w-7xl mx-auto flex items-center gap-2 pt-2 pb-0.5">
            <span className="text-xs text-gray-500">Ciudad:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-medium text-brand-600">
              <MapPin className="w-3 h-3" />
              {filters.ciudad}
              <button
                onClick={() => setFilters((f) => { const next = { ...f }; delete next.ciudad; return next; })}
                className="hover:text-brand-800 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ─── Contenido principal ─── */}
      <div className="flex-1 overflow-hidden">
        <div className={cn(
          "h-full max-w-7xl mx-auto",
          viewMode === "split" ? "grid grid-cols-1 lg:grid-cols-[1fr_420px]" :
          viewMode === "map"   ? "block" : "block"
        )}>
          {/* Mapa */}
          {(viewMode === "split" || viewMode === "map") && (
            <div className={cn(
              "relative",
              viewMode === "split" ? "h-full order-last lg:order-first" : "h-full"
            )}>
              <div className="absolute inset-2">
                <EventMap
                  events={events}
                  center={userPos ? [userPos.lat, userPos.lng] : [19.432, -99.133]}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Lista */}
          {(viewMode === "split" || viewMode === "list") && (
            <div className="h-full overflow-y-auto bg-white border-l border-surface-500">
              <div className="p-4">
                {/* Contador */}
                <p className="text-xs text-gray-500 mb-4">
                  {loading ? "Buscando..." : `${events.length} eventos encontrados`}
                </p>

                {/* Skeleton */}
                {loading && events.length === 0 && (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => <EventCardSkeleton key={i} />)}
                  </div>
                )}

                {/* Empty state */}
                {!loading && events.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-gray-900 font-semibold mb-2">Sin resultados</h3>
                    <p className="text-gray-500 text-sm">
                      Prueba cambiando los filtros o buscando en otra ciudad.
                    </p>
                  </div>
                )}

                {/* Lista de eventos */}
                <div className="space-y-4">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      userLat={userPos?.lat}
                      userLng={userPos?.lng}
                    />
                  ))}
                </div>

                {/* Cargar más */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full mt-6 btn-secondary py-3"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Cargar más eventos"
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
