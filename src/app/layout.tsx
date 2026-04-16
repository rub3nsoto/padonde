import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import AgeVerificationModal from "@/components/modals/AgeVerificationModal";

export const metadata: Metadata = {
  title: {
    default: "Eventure — Eventos sociales urbanos +18",
    template: "%s | Eventure",
  },
  description:
    "Descubre y crea los mejores eventos urbanos de tu ciudad. Fiestas, conciertos, afterparties y más. Solo para mayores de 18.",
  keywords: ["eventos", "fiestas", "conciertos", "CDMX", "afterparty", "urbano"],
  openGraph: {
    title: "Eventure — Eventos sociales urbanos +18",
    description: "La plataforma de eventos sociales urbanos más vibrante de LATAM.",
    type: "website",
    locale: "es_MX",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <head />
        <body>
          {/* Verificación de edad — modal obligatorio en primer acceso */}
          <AgeVerificationModal />

          <Navbar />

          <main className="min-h-screen pt-16">
            {children}
          </main>

          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#ffffff",
                border: "1px solid #dddddd",
                color: "#222222",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              },
              success: { iconTheme: { primary: "#FF385C", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
