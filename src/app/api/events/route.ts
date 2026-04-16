// GET  /api/events  — Lista de eventos con filtros
// POST /api/events  — Crear nuevo evento (requiere auth)
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { EventType, PrivacyType, Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// ─── GET — Listar eventos ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Parámetros de filtro
  const tipo      = searchParams.get("tipo") as EventType | null;
  const fecha     = searchParams.get("fecha");
  const precio    = searchParams.get("precio");
  const lat       = parseFloat(searchParams.get("lat") || "0");
  const lng       = parseFloat(searchParams.get("lng") || "0");
  const distKm    = parseFloat(searchParams.get("distancia") || "50");
  const page      = parseInt(searchParams.get("page") || "1");
  const pageSize  = Math.min(parseInt(searchParams.get("pageSize") || "20"), 50);
  const soloDisp  = searchParams.get("disponibles") === "true";
  const busqueda  = searchParams.get("q");
  const ciudad    = searchParams.get("ciudad");

  const where: Prisma.EventWhereInput = {
    estado: "ACTIVE",
    privacidad: { not: "LINK" }, // Los eventos privados por link no aparecen en el listado
  };

  // Filtro por tipo
  if (tipo) where.tipo = tipo;

  // Filtro por fecha
  const ahora = new Date();
  if (fecha === "today") {
    const fin = new Date(ahora); fin.setHours(23, 59, 59);
    where.fechaInicio = { gte: ahora, lte: fin };
  } else if (fecha === "weekend") {
    // Próximo sábado/domingo
    const dayOfWeek = ahora.getDay();
    const daysToSat = (6 - dayOfWeek + 7) % 7 || 7;
    const sat = new Date(ahora); sat.setDate(ahora.getDate() + daysToSat); sat.setHours(0,0,0);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1); sun.setHours(23,59,59);
    where.fechaInicio = { gte: sat, lte: sun };
  } else if (fecha === "week") {
    const finSemana = new Date(ahora); finSemana.setDate(ahora.getDate() + 7);
    where.fechaInicio = { gte: ahora, lte: finSemana };
  } else if (fecha === "month") {
    const finMes = new Date(ahora); finMes.setDate(ahora.getDate() + 30);
    where.fechaInicio = { gte: ahora, lte: finMes };
  } else {
    // Por defecto solo mostrar eventos futuros
    where.fechaInicio = { gte: ahora };
  }

  // Filtro por precio
  if (precio === "free") where.precio = null;
  else if (precio === "paid") where.precio = { gt: 0 };

  // Filtro por ciudad exacta
  if (ciudad) {
    where.ciudad = { contains: ciudad, mode: "insensitive" };
  }

  // Filtro por búsqueda de texto
  if (busqueda) {
    where.OR = [
      { nombre:      { contains: busqueda, mode: "insensitive" } },
      { descripcion: { contains: busqueda, mode: "insensitive" } },
      { ciudad:      { contains: busqueda, mode: "insensitive" } },
      { tags:        { has: busqueda.toLowerCase() } },
    ];
  }

  const [eventos, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        creator:    { select: { id: true, nombre: true, foto: true } },
        media:      { orderBy: { orden: "asc" }, take: 1 },
        _count:     { select: { asistencias: { where: { estado: { in: ["CONFIRMED", "RESERVED"] } } } } },
      },
      orderBy: { fechaInicio: "asc" },
      skip:  (page - 1) * pageSize,
      take:  pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  // Filtro por distancia (en memoria, para MVP — en producción usar PostGIS)
  let resultado = eventos;
  if (lat && lng) {
    resultado = eventos.filter((e) => {
      const R = 6371;
      const dLat = ((e.lat - lat) * Math.PI) / 180;
      const dLng = ((e.lng - lng) * Math.PI) / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(e.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return dist <= distKm;
    });
  }

  // Filtro: solo con disponibilidad
  if (soloDisp) {
    resultado = resultado.filter((e) =>
      !e.capacidadMaxima || e._count.asistencias < e.capacidadMaxima
    );
  }

  return NextResponse.json({
    data: resultado.map((e) => ({
      ...e,
      asistentesCount: e._count.asistencias,
      disponible: !e.capacidadMaxima || e._count.asistencias < e.capacidadMaxima,
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  });
}

// ─── POST — Crear evento ──────────────────────────────────────

const CreateEventSchema = z.object({
  nombre:          z.string().min(3).max(100),
  descripcion:     z.string().min(10).max(2000),
  tipo:            z.nativeEnum(EventType),
  tags:            z.array(z.string()).max(10).default([]),
  fechaInicio:     z.string().datetime(),
  fechaFin:        z.string().datetime(),
  zonaHoraria:     z.string().default("America/Mexico_City"),
  direccion:       z.string().min(5),
  ciudad:          z.string().min(2),
  lat:             z.number(),
  lng:             z.number(),
  capacidadMaxima: z.number().positive().optional(),
  aceptarSolicitudesCuandoLleno: z.boolean().default(false),
  privacidad:      z.nativeEnum(PrivacyType),
  codigoVestimenta: z.string().optional(),
  precio:          z.number().min(0).optional(),
  moneda:          z.string().default("MXN"),
  instrucciones:   z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth({ clockSkewInMs: 120_000 });
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Buscar usuario en BD
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (!user.verificadoEdad) return NextResponse.json({ error: "Debes verificar tu edad para crear eventos" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Validar que fechaFin > fechaInicio
  if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
    return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 });
  }

  // Generar link único para eventos privados por link
  const linkUnico = data.privacidad === "LINK" ? uuidv4() : undefined;

  const evento = await prisma.event.create({
    data: {
      ...data,
      creatorId: user.id,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      linkUnico,
      estado: "ACTIVE", // MVP: publicar directamente, sin moderación
    },
  });

  return NextResponse.json({ data: evento }, { status: 201 });
}
