// GET   /api/notifications — Mis notificaciones
// PATCH /api/notifications — Marcar como leídas
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [notificaciones, noLeidas] = await Promise.all([
    prisma.notification.findMany({
      where:   { userId: user.id },
      include: { event: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: "desc" },
      take:    50,
    }),
    prisma.notification.count({ where: { userId: user.id, leida: false } }),
  ]);

  return NextResponse.json({ data: notificaciones, noLeidas });
}

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const ids  = body.ids as string[] | undefined;

  if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: user.id },
      data:  { leida: true },
    });
  } else {
    // Marcar todas como leídas
    await prisma.notification.updateMany({
      where: { userId: user.id, leida: false },
      data:  { leida: true },
    });
  }

  return NextResponse.json({ message: "Notificaciones marcadas como leídas" });
}
