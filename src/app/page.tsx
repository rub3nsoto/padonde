export const dynamic = "force-dynamic";
// Landing page — muestra eventos destacados + CTA de registro
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Shield, MapPin, Users, Star } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import EventCard from "@/components/events/EventCard";
import type { Event } from "@/types";

// Revalidar cada 5 minutos
export const revalidate = 300;

async function getFeaturedEvents(): Promise<Event[]> {
  const eventos = await prisma.event.findMany({
    where: {
      estado:   "ACTIVE",
      privacidad: { not: "LINK" },
      fechaInicio: { gte: new Date() },
    },
    include: {
      creator: { select: { id: true, nombre: true, foto: true } },
      media:   { orderBy: { orden: "asc" }, take: 1 },
      _count:  { select: { asistencias: { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } } } },
    },
    orderBy: { vistas: "desc" },
    take: 6,
  });

  return eventos.map((e) => ({
    ...e,
    fechaInicio:    e.fechaInicio.toISOString(),
    fechaFin:       e.fechaFin.toISOString(),
    createdAt:      e.createdAt.toISOString(),
    updatedAt:      undefined as any,
    asistentesCount: e._count.asistencias,
    disponible:     !e.capacidadMaxima || e._count.asistencias < e.capacidadMaxima,
    creator: {
      ...e.creator,
      createdAt: "",
    },
    tags:  e.tags,
    media: e.media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  })) as Event[];
}

const FEATURES = [
  {
    icon: MapPin,
    title: "Eventos cerca de ti",
    desc: "Descubre lo que pasa en tu ciudad con geolocalización automática y mapa interactivo.",
    color: "text-brand-500",
    bg: "bg-brand-500/8 border-brand-500/20",
  },
  {
    icon: Shield,
    title: "Plataforma +18",
    desc: "Comunidad verificada para adultos. Eventos exclusivos con estándares de calidad.",
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-200",
  },
  {
    icon: Zap,
    title: "Crea tu evento",
    desc: "Publica cualquier tipo de evento en minutos. Gratis, de pago o por invitación.",
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-200",
  },
  {
    icon: Users,
    title: "Tu comunidad",
    desc: "Conéctate con personas que comparten tus intereses. Networking real, sin algoritmos.",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
];

const STATS = [
  { value: "12K+", label: "Asistentes activos" },
  { value: "850+", label: "Eventos al mes" },
  { value: "32",   label: "Ciudades" },
  { value: "4.9★", label: "Valoración media" },
];

export default async function LandingPage() {
  const { userId } = await auth();
  const events = await getFeaturedEvents();

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 bg-white">
        {/* Grid decorativo sutil */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Acento de color suave */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/8 border border-brand-500/15 text-brand-500 text-sm font-medium mb-8">
            <Star className="w-3.5 h-3.5 fill-current" />
            La plataforma de eventos +18 más vibrante de LATAM
          </div>

          {/* Título principal */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-gray-900 mb-6 leading-none tracking-tight">
            Tu ciudad.
            <br />
            <span className="gradient-text">Tu noche.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Descubre y crea los mejores eventos urbanos de tu ciudad.
            Fiestas, conciertos, afterparties, networking y más.
            Solo para mayores de 18.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explorar" className="btn-primary text-lg px-8 py-4">
              Explorar eventos
              <ArrowRight className="w-5 h-5" />
            </Link>
            {!userId && (
              <Link href="/auth/registro" className="btn-secondary text-lg px-8 py-4">
                Crear cuenta gratis
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-brand-500">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-300">
          <div className="w-5 h-8 border-2 border-gray-200 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-gray-300 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── Eventos destacados ────────────────────────────── */}
      {events.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-brand-500 text-sm font-medium mb-2">Eventos destacados</p>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
                  Lo más caliente ahora 🔥
                </h2>
              </div>
              <Link href="/explorar" className="btn-ghost hidden sm:flex">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            <div className="text-center mt-10 sm:hidden">
              <Link href="/explorar" className="btn-secondary">
                Ver todos los eventos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Features ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface-700">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Todo lo que necesitas para
              <span className="gradient-text"> vivir la ciudad</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Eventure es tu plataforma para descubrir, organizar y disfrutar
              los mejores eventos sociales urbanos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`bg-white p-6 border ${f.bg} rounded-2xl hover:shadow-lg transition-shadow duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} border flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-brand-500 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)"
            }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                ¿Listo para organizar tu evento?
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Crea tu evento en minutos. Gestiona asistentes, comparte tu link y
                conecta con tu comunidad.
              </p>
              <Link href="/crear" className="inline-flex items-center gap-2 bg-white text-brand-500 font-bold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors text-lg">
                Crear mi evento gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-surface-500 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-black gradient-text">Eventure</span>
              </div>
              <p className="text-gray-500 text-sm">
                Plataforma de eventos sociales urbanos para mayores de 18 años.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3 text-sm">Explorar</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/explorar" className="hover:text-gray-900">Todos los eventos</Link></li>
                <li><Link href="/explorar?tipo=PARTY" className="hover:text-gray-900">Fiestas</Link></li>
                <li><Link href="/explorar?tipo=CONCERT" className="hover:text-gray-900">Conciertos</Link></li>
                <li><Link href="/explorar?tipo=NETWORKING" className="hover:text-gray-900">Networking</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3 text-sm">Organizadores</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/crear" className="hover:text-gray-900">Crear evento</Link></li>
                <li><Link href="/dashboard" className="hover:text-gray-900">Mi dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3 text-sm">Legal</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/legal/terminos" className="hover:text-gray-900">Términos y Condiciones</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-gray-900">Aviso de Privacidad</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-surface-500 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs">
              © 2024 Eventure. Solo para mayores de 18 años. Plataforma intermediaria tecnológica.
            </p>
            <p className="text-gray-400 text-xs">
              Hecho con ❤️ para LATAM
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
