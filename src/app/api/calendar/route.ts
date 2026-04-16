export const dynamic = "force-dynamic";
// GET /api/calendar?eventId=xxx — Descargar archivo .ics del evento
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICS } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId requerido" }, { status: 400 });

  const evento = await prisma.event.findUnique({
    where: { id: eventId },
    include: { creator: { select: { nombre: true } } },
  });
  if (!evento) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const ics = generateICS({
    id:          evento.id,
    nombre:      evento.nombre,
    descripcion: evento.descripcion,
    fechaInicio: evento.fechaInicio,
    fechaFin:    evento.fechaFin,
    direccion:   evento.direccion,
    organizador: evento.creator.nombre,
    url:         `${appUrl}/evento/${evento.id}`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${evento.nombre.replace(/[^a-z0-9]/gi, "_")}.ics"`,
    },
  });
}
