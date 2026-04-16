// Stripe deshabilitado en modo local
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ received: true });
}
