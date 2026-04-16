// GET /api/attendances/mine — Asistencias del usuario actual (para mis-eventos)
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const asistencias = await prisma.attendance.findMany({
    where: { userId: user.id },
    include: {
      event: {
        include: {
          media: { take: 1, orderBy: { orden: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: asistencias.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      event: a.event ? {
        ...a.event,
        fechaInicio: a.event.fechaInicio.toISOString(),
        fechaFin:    a.event.fechaFin.toISOString(),
        createdAt:   a.event.createdAt.toISOString(),
        media:       a.event.media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      } : null,
    })),
  });
}
