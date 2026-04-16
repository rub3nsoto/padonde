// GET /api/events/mine — Eventos creados por el usuario actual (para el dashboard)
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth({ clockSkewInMs: 120_000 });
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const eventos = await prisma.event.findMany({
    where: { creatorId: user.id },
    include: {
      media:  { orderBy: { orden: "asc" }, take: 1 },
      _count: {
        select: {
          asistencias: { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: eventos.map((e) => ({
      ...e,
      asistentesCount: e._count.asistencias,
      creator: { id: user.id, nombre: user.nombre, foto: user.foto },
    })),
  });
}
