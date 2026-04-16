export const dynamic = "force-dynamic";
// Stripe deshabilitado en modo local
// Para habilitar en producción: instalar stripe, descomentar lib/stripe.ts y restaurar este archivo
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Pagos no disponibles en modo de prueba" },
    { status: 503 }
  );
}
