// Stripe deshabilitado para pruebas locales
// Para producción: npm install stripe y restaurar la implementación completa

export const stripe = null as any;

export async function createCheckoutSession(_params: unknown) {
  throw new Error("Stripe no está configurado en modo local");
}

export function constructWebhookEvent(_payload: unknown, _signature: unknown) {
  throw new Error("Stripe no está configurado en modo local");
}
