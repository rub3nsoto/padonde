// POST /api/upload — Upload de media a Cloudinary
// Acepta multipart/form-data con campo "file" + "eventId" + "orden"
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadMedia } from "@/lib/cloudinary";

const MAX_PHOTOS = 10;
const MAX_VIDEOS = 2;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth({ clockSkewInMs: 120_000 });
  if (!clerkId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const formData = await req.formData();
  const file    = formData.get("file") as File | null;
  const eventId = formData.get("eventId") as string | null;
  const orden   = parseInt(formData.get("orden") as string || "0");

  if (!file || !eventId) {
    return NextResponse.json({ error: "file y eventId son requeridos" }, { status: 400 });
  }

  // Verificar que el usuario es el creador del evento
  const evento = await prisma.event.findUnique({ where: { id: eventId } });
  if (!evento || evento.creatorId !== user.id) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 100MB)" }, { status: 400 });
  }

  // Determinar tipo
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) {
    return NextResponse.json({ error: "Solo se permiten imágenes y videos" }, { status: 400 });
  }

  // Verificar límites actuales
  const mediaActual = await prisma.eventMedia.findMany({ where: { eventId } });
  const fotosCount  = mediaActual.filter((m) => m.tipo === "PHOTO").length;
  const videosCount = mediaActual.filter((m) => m.tipo === "VIDEO").length;

  if (isImage && fotosCount >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Máximo ${MAX_PHOTOS} fotos por evento` }, { status: 400 });
  }
  if (isVideo && videosCount >= MAX_VIDEOS) {
    return NextResponse.json({ error: `Máximo ${MAX_VIDEOS} videos por evento` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadMedia(buffer, isVideo ? "video" : "image", eventId, orden);

  const media = await prisma.eventMedia.create({
    data: {
      eventId,
      url:      result.url,
      publicId: result.publicId,
      tipo:     result.tipo,
      orden,
    },
  });

  return NextResponse.json({ data: media }, { status: 201 });
}
