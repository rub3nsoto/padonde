export const dynamic = "force-dynamic";
// Perfil público de usuario
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import EventCard from "@/components/events/EventCard";
import { timeAgo } from "@/lib/utils";

export default async function PerfilPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id:        true,
      nombre:    true,
      foto:      true,
      bio:       true,
      createdAt: true,
      _count: {
        select: {
          eventosCreados: { where: { estado: "ACTIVE" } },
          asistencias:    { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } },
        },
      },
      eventosCreados: {
        where: {
          estado:      "ACTIVE",
          privacidad:  { not: "LINK" },
          fechaInicio: { gte: new Date() },
        },
        include: {
          media:  { take: 1, orderBy: { orden: "asc" } },
          _count: { select: { asistencias: { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } } } },
        },
        orderBy: { fechaInicio: "asc" },
        take:    6,
      },
    },
  });

  if (!user) notFound();

  const eventos = user.eventosCreados.map((e) => ({
    ...e,
    fechaInicio:    e.fechaInicio.toISOString(),
    fechaFin:       e.fechaFin.toISOString(),
    createdAt:      e.createdAt.toISOString(),
    updatedAt:      undefined as any,
    creator:        { id: user.id, nombre: user.nombre, foto: user.foto || undefined, createdAt: "" },
    media:          e.media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    asistentesCount: e._count.asistencias,
    disponible:     !e.capacidadMaxima || e._count.asistencias < e.capacidadMaxima,
    tags:           e.tags,
  })) as any[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Perfil header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {user.foto ? (
            <Image
              src={user.foto}
              alt={user.nombre}
              width={96}
              height={96}
              className="rounded-full ring-4 ring-brand-500/30 flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-brand flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
              {user.nombre[0]}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-black text-white mb-2">{user.nombre}</h1>
            {user.bio && (
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-4 h-4" />
                Miembro desde {timeAgo(user.createdAt)}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-4 h-4 text-brand-400" />
                <span className="text-white font-medium">{user._count.eventosCreados}</span>
                eventos organizados
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Users className="w-4 h-4 text-brand-400" />
                <span className="text-white font-medium">{user._count.asistencias}</span>
                eventos asistidos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eventos del organizador */}
      {eventos.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-5">
            Próximos eventos de {user.nombre}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card py-12 text-center">
          <div className="text-4xl mb-4">🎈</div>
          <p className="text-gray-400">
            {user.nombre} no tiene eventos próximos publicados
          </p>
        </div>
      )}
    </div>
  );
}
