export const dynamic = "force-dynamic";
// Página de detalle de evento — Server Component con Client islands
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import EventDetailClient from "./EventDetailClient";

interface Props {
  params:      { id: string };
  searchParams: { inv?: string; pago?: string };
}

// Generar metadata dinámica para SEO / compartir
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const evento = await prisma.event.findUnique({
    where:   { id: params.id },
    include: { media: { take: 1 } },
  });
  if (!evento) return { title: "Evento no encontrado" };

  return {
    title:       evento.nombre,
    description: evento.descripcion.slice(0, 160),
    openGraph: {
      title:  evento.nombre,
      description: evento.descripcion.slice(0, 160),
      images: evento.media[0] ? [{ url: evento.media[0].url }] : [],
      type:   "website",
    },
  };
}

export default async function EventoPage({ params, searchParams }: Props) {
  // Fetch del servidor para SEO (el client component hace su propio fetch para interactividad)
  const evento = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, nombre: true, foto: true, bio: true } },
      media:   { orderBy: { orden: "asc" } },
      _count:  { select: { asistencias: { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } } } },
    },
  });

  if (!evento) notFound();

  // Verificar acceso a eventos privados por link
  if (evento.privacidad === "LINK" && !searchParams.inv) {
    // El client component manejará esto con mejor UX
  }

  const eventoSerialized = {
    ...evento,
    fechaInicio: evento.fechaInicio.toISOString(),
    fechaFin:    evento.fechaFin.toISOString(),
    createdAt:   evento.createdAt.toISOString(),
    updatedAt:   undefined as any,
    media:       evento.media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    creator: {
      ...evento.creator,
      createdAt: "",
    },
    asistentesCount: evento._count.asistencias,
    disponible: !evento.capacidadMaxima || evento._count.asistencias < evento.capacidadMaxima,
  };

  return (
    <EventDetailClient
      initialEvent={eventoSerialized as any}
      invToken={searchParams.inv}
      pagoStatus={searchParams.pago}
    />
  );
}
