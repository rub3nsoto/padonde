// Middleware de Clerk — protege rutas que requieren autenticación
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Solo proteger rutas de página (no APIs — esas manejan auth con JSON 401)
const isProtectedPage = createRouteMatcher([
  "/crear(.*)",
  "/dashboard(.*)",
  "/mis-eventos(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Solo redirigir al login en rutas de página, no en APIs
  if (isProtectedPage(req)) {
    const { userId } = await auth();
    if (!userId) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
}, { clockSkewInMs: 120_000 });

export const config = {
  matcher: [
    // Skip archivos estáticos de Next.js y _next
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
