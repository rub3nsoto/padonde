// POST /api/users — Crear o actualizar perfil de usuario (llamado tras registro de Clerk)
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { esMayorDeEdad } from "@/lib/utils";

const CreateUserSchema = z.object({
  email:          z.string().email(),
  nombre:         z.string().min(2).max(100),
  fechaNacimiento: z.string(), // ISO date string
  aceptoTerminos: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
});

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, nombre, fechaNacimiento, aceptoTerminos } = parsed.data;
  const fechaNac = new Date(fechaNacimiento);

  // Verificación de mayoría de edad
  const mayordEdad = esMayorDeEdad(fechaNac);

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      nombre,
      fechaNacimiento: fechaNac,
      verificadoEdad: mayordEdad,
      aceptoTerminos,
      fechaAceptacion: aceptoTerminos ? new Date() : undefined,
    },
    create: {
      clerkId,
      email,
      nombre,
      fechaNacimiento: fechaNac,
      verificadoEdad: mayordEdad,
      aceptoTerminos,
      fechaAceptacion: aceptoTerminos ? new Date() : new Date(),
    },
  });

  if (!mayordEdad) {
    return NextResponse.json(
      { error: "Debes ser mayor de 18 años para usar Eventure.", code: "UNDERAGE" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: user }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      _count: {
        select: { eventosCreados: true, asistencias: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json({ data: user });
}
