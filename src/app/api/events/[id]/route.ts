export const dynamic = "force-dynamic";
// GET    /api/events/:id — Detalle de evento
// PATCH  /api/events/:id — Editar evento (solo el creador) + notifica asistentes
// DELETE /api/events/:id — Cancelar evento (solo el creador) + notifica asistentes
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEventUpdate, sendEventCancellation, sendCapacityReductionNotification } from "@/lib/email";
import { z } from "zod";
import { EventType, PrivacyType } from "@prisma/client";

// ─── GET ─────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkId } = await auth();

  const evento = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, nombre: true, foto: true, bio: true } },
      media:   { orderBy: { orden: "asc" } },
      _count:  {
        select: {
          asistencias: { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } },
        },
      },
    },
  });

  if (!evento) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  // Verificar acceso a eventos privados por link
  if (evento.privacidad === "LINK") {
    const invToken = req.nextUrl.searchParams.get("inv");
    const hasAccess = invToken
      ? await prisma.invitation.findFirst({ where: { token: invToken, eventId: evento.id } })
      : false;
    if (!hasAccess) {
      return NextResponse.json({ error: "Acceso denegado. Necesitas el link de invitación." }, { status: 403 });
    }
  }

  // Incrementar vistas (fire and forget)
  prisma.event.update({ where: { id: params.id }, data: { vistas: { increment: 1 } } }).catch(() => {});

  // Estado de asistencia del usuario actual
  let userAttendance = null;
  if (clerkId) {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (user) {
      const att = await prisma.attendance.findUnique({
        where: { userId_eventId: { userId: user.id, eventId: params.id } },
      });
      userAttendance = att?.estado ?? null;
    }
  }

  return NextResponse.json({
    data: {
      ...evento,
      asistentesCount: evento._count.asistencias,
      disponible: !evento.capacidadMaxima || evento._count.asistencias < evento.capacidadMaxima,
      userAttendance,
    },
  });
}

// ─── PATCH — Editar evento ────────────────────────────────────

const UpdateEventSchema = z.object({
  nombre:           z.string().min(3).max(100).optional(),
  descripcion:      z.string().min(10).max(2000).optional(),
  tipo:             z.nativeEnum(EventType).optional(),
  tags:             z.array(z.string()).max(10).optional(),
  fechaInicio:      z.string().datetime().optional(),
  fechaFin:         z.string().datetime().optional(),
  zonaHoraria:      z.string().optional(),
  direccion:        z.string().min(5).optional(),
  ciudad:           z.string().min(2).optional(),
  lat:              z.number().optional(),
  lng:              z.number().optional(),
  capacidadMaxima:  z.number().positive().nullable().optional(),
  aceptarSolicitudesCuandoLleno: z.boolean().optional(),
  privacidad:       z.nativeEnum(PrivacyType).optional(),
  codigoVestimenta: z.string().optional(),
  precio:           z.number().min(0).nullable().optional(),
  moneda:           z.string().optional(),
  instrucciones:    z.string().optional(),
  notaCambios:      z.string().optional(), // mensaje extra a los asistentes
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const evento = await prisma.event.findUnique({ where: { id: params.id } });
  if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (evento.creatorId !== user.id) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  if (evento.estado === "CANCELLED" || evento.estado === "FINISHED") {
    return NextResponse.json({ error: "No puedes editar un evento cancelado o finalizado" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { notaCambios, ...updateData } = parsed.data;

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...updateData,
      fechaInicio: updateData.fechaInicio ? new Date(updateData.fechaInicio) : undefined,
      fechaFin:    updateData.fechaFin    ? new Date(updateData.fechaFin)    : undefined,
    },
    include: {
      creator: { select: { id: true, nombre: true, foto: true, bio: true } },
      media:   { orderBy: { orden: "asc" } },
    },
  });

  // ── Cancelar asistentes excedentes si se redujo la capacidad ──
  if (updateData.capacidadMaxima != null) {
    const asistentesActivos = await prisma.attendance.findMany({
      where:   { eventId: params.id, estado: { in: ["CONFIRMED", "RESERVED"] } },
      orderBy: { createdAt: "asc" }, // los primeros en registrarse se quedan
      include: { user: { select: { email: true, nombre: true, id: true } } },
    });

    const exceso = asistentesActivos.length - updateData.capacidadMaxima;
    if (exceso > 0) {
      // Los últimos 'exceso' en registrarse son los que salen
      const excedentes = asistentesActivos.slice(-exceso);
      const idsExcedentes = excedentes.map((a) => a.id);

      await prisma.attendance.updateMany({
        where: { id: { in: idsExcedentes } },
        data:  { estado: "CANCELLED" },
      });

      await prisma.notification.createMany({
        data: excedentes.map((a) => ({
          userId:  a.user.id,
          eventId: params.id,
          tipo:    "EVENT_UPDATED" as const,
          titulo:  "Tu asistencia fue cancelada",
          mensaje: `El organizador redujo la capacidad de "${updated.nombre}" y tu lugar fue liberado.`,
        })),
      });

      Promise.all(
        excedentes.map((a) =>
          sendCapacityReductionNotification(a.user.email, a.user.nombre, {
            nombre: updated.nombre,
            id:     updated.id,
          })
        )
      ).catch(console.error);
    }
  }

  // ── Notificar a todos los asistentes que siguen activos ──
  const asistentes = await prisma.attendance.findMany({
    where: { eventId: params.id, estado: { in: ["CONFIRMED", "RESERVED"] } },
    include: { user: { select: { email: true, nombre: true, id: true } } },
  });

  if (asistentes.length > 0) {
    await prisma.notification.createMany({
      data: asistentes.map((a) => ({
        userId:  a.user.id,
        eventId: params.id,
        tipo:    "EVENT_UPDATED" as const,
        titulo:  "Evento actualizado",
        mensaje: `"${updated.nombre}" ha sido actualizado.${notaCambios ? " " + notaCambios : ""}`,
      })),
    });

    Promise.all(
      asistentes.map((a) =>
        sendEventUpdate(
          a.user.email,
          a.user.nombre,
          { nombre: updated.nombre, fechaInicio: updated.fechaInicio, direccion: updated.direccion, id: updated.id },
          notaCambios || ""
        )
      )
    ).catch(console.error);
  }

  return NextResponse.json({ data: updated });
}

// ─── DELETE — Cancelar evento ─────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const evento = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      asistencias: {
        where: { estado: { in: ["CONFIRMED", "RESERVED"] } },
        include: { user: { select: { email: true, nombre: true, id: true } } },
      },
    },
  });

  if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (evento.creatorId !== user.id) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  await prisma.event.update({ where: { id: params.id }, data: { estado: "CANCELLED" } });

  if (evento.asistencias.length > 0) {
    await prisma.notification.createMany({
      data: evento.asistencias.map((a) => ({
        userId:  a.user.id,
        eventId: params.id,
        tipo:    "EVENT_CANCELLED" as const,
        titulo:  "Evento cancelado",
        mensaje: `El evento "${evento.nombre}" fue cancelado por el organizador.`,
      })),
    });

    Promise.all(
      evento.asistencias.map((a) =>
        sendEventCancellation(a.user.email, a.user.nombre, {
          nombre:      evento.nombre,
          fechaInicio: evento.fechaInicio,
        })
      )
    ).catch(console.error);
  }

  return NextResponse.json({ message: "Evento cancelado" });
}
