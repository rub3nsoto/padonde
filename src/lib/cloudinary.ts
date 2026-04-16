// Upload de media a Cloudinary desde el servidor
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url:      string;
  publicId: string;
  tipo:     "PHOTO" | "VIDEO";
}

// Upload desde buffer (usado en el API route de /api/upload)
export async function uploadMedia(
  buffer: Buffer,
  tipo: "image" | "video",
  eventId: string,
  orden: number
): Promise<UploadResult> {
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:        `eventure/events/${eventId}`,
          resource_type: tipo,
          transformation: tipo === "image"
            ? [{ width: 1200, height: 800, crop: "fill", quality: "auto" }]
            : [{ width: 1280, height: 720, crop: "fill", quality: "auto" }],
          public_id: `${tipo}_${orden}_${Date.now()}`,
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result as { secure_url: string; public_id: string });
        }
      );
      stream.end(buffer);
    }
  );

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    tipo:     tipo === "image" ? "PHOTO" : "VIDEO",
  };
}

// Eliminar media de Cloudinary (al editar o cancelar evento)
export async function deleteMedia(publicId: string, tipo: "image" | "video") {
  await cloudinary.uploader.destroy(publicId, { resource_type: tipo });
}

// Generar signature para upload directo desde cliente (más eficiente para archivos grandes)
export function generateUploadSignature(params: Record<string, string>) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );
  return { signature, timestamp };
}
