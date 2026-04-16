// GET   /api/users/:id — Perfil público de usuario
// PATCH /api/users/:id — Actualizar propio perfil
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        where: { estado: "ACTIVE", fechaInicio: { gte: new Date() } },
        include: { media: { take: 1, orderBy: { orden: "asc" } } },
        orderBy: { fechaInicio: "asc" },
        take: 6,
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json({ data: user });
}

const UpdateProfileSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  bio:    z.string().max(500).optional(),
  foto:   z.string().url().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || user.id !== params.id) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = await req.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: params.id },
    data:  parsed.data,
  });

  return NextResponse.json({ data: updated });
}
