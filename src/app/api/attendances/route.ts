export const dynamic = "force-dynamic";
// POST   /api/attendances  — Registrar asistencia / solicitar invitación
// GET    /api/attendances  — Lista de asistentes de un evento (solo organizador)
// PATCH  /api/attendances  — Aprobar / rechazar solicitud (solo organizador)
// DELETE /api/attendances  — Cancelar asistencia propia
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  sendAttendanceConfirmation,
  sendApprovalNotification,
} from "@/lib/email";

// ─── GET — Asistentes de un evento ───────────────────────────

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId requerido" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Verificar que es el organizador del evento
  const evento = await prisma.event.findUnique({ where: { id: eventId } });
  if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (evento.creatorId !== user.id) return NextResponse.json({ error: "Solo el organizador puede ver los asistentes" }, { status: 403 });

  const estado = req.nextUrl.searchParams.get("estado");
  const asistencias = await prisma.attendance.findMany({
    where: {
      eventId,
      ...(estado ? { estado: estado as any } : {}),
    },
    include: {
      user: { select: { id: true, nombre: true, foto: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: asistencias });
}

// ─── POST — Registrar asistencia ──────────────────────────────

const CreateAttendanceSchema = z.object({
  eventId: z.string(),
});

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (!user.verificadoEdad) return NextResponse.json({ error: "Debes verificar tu edad para asistir a eventos" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateAttendanceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "eventId requerido" }, { status: 400 });

  const { eventId } = parsed.data;

  // Verificar que el evento existe y está activo
  const evento = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { asistencias: { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } } } },
    },
  }) as any;
  if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (evento.estado !== "ACTIVE") return NextResponse.json({ error: "El evento no está disponible" }, { status: 400 });

  // No puede asistir a su propio evento
  if (evento.creatorId === user.id) return NextResponse.json({ error: "Eres el organizador de este evento" }, { status: 400 });

  // Verificar si ya hay asistencia
  const existing = await prisma.attendance.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });
  if (existing) return NextResponse.json({ error: "Ya tienes una asistencia para este evento", data: existing }, { status: 409 });

  // Verificar capacidad
  const estaLleno = !!(evento.capacidadMaxima && evento._count.asistencias >= evento.capacidadMaxima);
  if (estaLleno) {
    // Si acepta solicitudes en lista de espera, crear con estado PENDING
    if ((evento as any).aceptarSolicitudesCuandoLleno) {
      const asistenciaEspera = await prisma.attendance.create({
        data: { userId: user.id, eventId, estado: "PENDING" },
      });
      await prisma.notification.create({
        data: {
          userId:  user.id,
          eventId: evento.id,
          tipo:    "ATTENDANCE_CONFIRMED",
          titulo:  "En lista de espera",
          mensaje: `Estás en la lista de espera de "${evento.nombre}". El organizador te notificará si hay un lugar disponible.`,
        },
      });
      return NextResponse.json({ data: asistenciaEspera, waitlist: true }, { status: 201 });
    }
    return NextResponse.json({ error: "El evento está lleno" }, { status: 400 });
  }

  // Evento de pago → redirigir a Stripe (no crear asistencia aún)
  if (evento.precio && evento.precio > 0) {
    return NextResponse.json({
      requiresPayment: true,
      message: "Este evento requiere pago. Usa el endpoint de Stripe.",
    }, { status: 402 });
  }

  // Determinar estado inicial según tipo de privacidad
  const estadoInicial = evento.privacidad === "APPROVAL" ? "PENDING" : "CONFIRMED";

  const asistencia = await prisma.attendance.create({
    data: { userId: user.id, eventId, estado: estadoInicial },
  });

  // Notificar por email si se confirmó directamente
  if (estadoInicial === "CONFIRMED") {
    sendAttendanceConfirmation(user.email, user.nombre, {
      id:         evento.id,
      nombre:     evento.nombre,
      fechaInicio: evento.fechaInicio,
      direccion:  evento.direccion,
    }).catch(console.error);

    await prisma.notification.create({
      data: {
        userId:  user.id,
        eventId: evento.id,
        tipo:    "ATTENDANCE_CONFIRMED",
        titulo:  "¡Asistencia confirmada!",
        mensaje: `Tu asistencia a "${evento.nombre}" ha sido confirmada.`,
      },
    });
  }

  return NextResponse.json({ data: asistencia }, { status: 201 });
}

// ─── PATCH — Aprobar / rechazar solicitud ─────────────────────

const UpdateAttendanceSchema = z.object({
  attendanceId:   z.string(),
  estado:         z.enum(["CONFIRMED", "REJECTED", "CANCELLED"]),
  notaOrganizador: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateAttendanceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { attendanceId, estado, notaOrganizador } = parsed.data;

  const asistencia = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      event: true,
      user:  { select: { email: true, nombre: true } },
    },
  });

  if (!asistencia) return NextResponse.json({ error: "Asistencia no encontrada" }, { status: 404 });
  if (asistencia.event.creatorId !== user.id) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data:  { estado, notaOrganizador },
  });

  // Notificar al usuario sobre la decisión
  if (estado !== "CANCELLED") {
    const aprobado = estado === "CONFIRMED";
    sendApprovalNotification(
      asistencia.user.email,
      asistencia.user.nombre,
      { nombre: asistencia.event.nombre, id: asistencia.event.id },
      aprobado,
      notaOrganizador
    ).catch(console.error);

    await prisma.notification.create({
      data: {
        userId:  asistencia.userId,
        eventId: asistencia.eventId,
        tipo:    aprobado ? "ATTENDANCE_APPROVED" : "ATTENDANCE_REJECTED",
        titulo:  aprobado ? "¡Solicitud aprobada!" : "Solicitud no aprobada",
        mensaje: aprobado
          ? `Tu solicitud para "${asistencia.event.nombre}" fue aprobada.`
          : `Tu solicitud para "${asistencia.event.nombre}" no fue aprobada.`,
      },
    });
  } else {
    await prisma.notification.create({
      data: {
        userId:  asistencia.userId,
        eventId: asistencia.eventId,
        tipo:    "EVENT_UPDATED",
        titulo:  "Asistencia cancelada",
        mensaje: `El organizador canceló tu asistencia a "${asistencia.event.nombre}".${notaOrganizador ? " " + notaOrganizador : ""}`,
      },
    });
  }

  return NextResponse.json({ data: updated });
}

// ─── DELETE — Cancelar asistencia ────────────────────────────

export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId requerido" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.attendance.deleteMany({
    where: { userId: user.id, eventId },
  });

  return NextResponse.json({ message: "Asistencia cancelada" });
}
