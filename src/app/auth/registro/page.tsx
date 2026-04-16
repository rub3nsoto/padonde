export const dynamic = "force-dynamic";
"use client";
// Página de registro — formulario de perfil post-Clerk con verificación de edad
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { SignUp } from "@clerk/nextjs";
import { esMayorDeEdad } from "@/lib/utils";

type Step = "clerk" | "perfil" | "done";

export default function RegistroPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const step        = (searchParams.get("step") as Step) || "clerk";

  const [form, setForm]       = useState({
    nombre:         user?.fullName || "",
    fechaNacimiento: "",
    aceptoTerminos: false,
  });
  const [loading, setLoading] = useState(false);
  const [mayorEdad, setMayorEdad] = useState<boolean | null>(null);

  useEffect(() => {
    if (form.fechaNacimiento) {
      setMayorEdad(esMayorDeEdad(form.fechaNacimiento));
    }
  }, [form.fechaNacimiento]);

  useEffect(() => {
    if (isLoaded && isSignedIn && step !== "perfil") {
      router.push("/auth/registro?step=perfil");
    }
  }, [isLoaded, isSignedIn, step, router]);

  // Mostrar spinner mientras Clerk carga la sesión
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.aceptoTerminos) { toast.error("Debes aceptar los términos y condiciones"); return; }
    if (!form.fechaNacimiento) { toast.error("Ingresa tu fecha de nacimiento"); return; }
    if (!mayorEdad) { toast.error("Debes ser mayor de 18 años para usar Eventure"); return; }
    if (!isLoaded || !isSignedIn) { toast.error("Espera un momento e intenta de nuevo"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:          user?.primaryEmailAddress?.emailAddress,
          nombre:         form.nombre || user?.fullName,
          fechaNacimiento: form.fechaNacimiento,
          aceptoTerminos: form.aceptoTerminos,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "UNDERAGE") {
          toast.error("Debes ser mayor de 18 años para usar Eventure");
          return;
        }
        toast.error(data.error || "Error al crear el perfil");
        return;
      }

      toast.success("¡Bienvenido/a a Eventure!");
      const redirectTo = searchParams.get("redirect") || "/explorar";
      router.push(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Registro con Clerk
  if (!isSignedIn && step !== "perfil") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black gradient-text">Crear cuenta</h1>
            <p className="text-gray-400 mt-2">Solo para mayores de 18 años</p>
          </div>
          <div className="flex justify-center">
            <SignUp
              routing="hash"
              afterSignUpUrl="/auth/registro?step=perfil"
              appearance={{
                variables: {
                  colorPrimary: "#FF385C",
                  colorBackground: "#ffffff",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#222222",
                  colorText: "#222222",
                  colorTextSecondary: "#717171",
                  borderRadius: "12px",
                },
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Completar perfil con verificación de edad
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-surface-700">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-brand-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">¡Casi listo!</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Completa tu perfil para empezar a explorar eventos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="label">Nombre completo *</label>
            <input
              type="text"
              className="input"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Tu nombre"
              required
            />
          </div>

          {/* Fecha de nacimiento — verificación de edad */}
          <div>
            <label className="label">Fecha de nacimiento *</label>
            <input
              type="date"
              className="input"
              value={form.fechaNacimiento}
              onChange={(e) => setForm((f) => ({ ...f, fechaNacimiento: e.target.value }))}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              required
            />
            {form.fechaNacimiento && (
              <div className={`flex items-center gap-2 mt-2 text-xs font-medium ${mayorEdad ? "text-green-600" : "text-red-600"}`}>
                {mayorEdad
                  ? <><CheckCircle className="w-3 h-3" /> Eres mayor de 18 años ✓</>
                  : <><AlertTriangle className="w-3 h-3" /> Debes ser mayor de 18 años para acceder</>
                }
              </div>
            )}
          </div>

          {/* Aviso legal */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-gray-700 leading-relaxed">
            <strong className="text-gray-900 font-semibold">¿Por qué pedimos tu fecha de nacimiento?</strong><br/>
            <span className="mt-1 block">
              Eventure es una plataforma exclusiva para adultos (+18). Tu fecha de nacimiento solo
              se usa para verificar tu mayoría de edad. No la compartimos con terceros.
            </span>
          </div>

          {/* Aceptar términos */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={form.aceptoTerminos}
                onChange={(e) => setForm((f) => ({ ...f, aceptoTerminos: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                form.aceptoTerminos ? "bg-brand-500 border-brand-500" : "border-gray-400 bg-white"
              }`}>
                {form.aceptoTerminos && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-gray-700 text-sm leading-relaxed">
              Confirmo que tengo 18 años o más y acepto los{" "}
              <Link href="/legal/terminos" target="_blank" className="text-brand-500 font-medium hover:underline">
                Términos y Condiciones
              </Link>{" "}
              y el{" "}
              <Link href="/legal/privacidad" target="_blank" className="text-brand-500 font-medium hover:underline">
                Aviso de Privacidad
              </Link>
              . Entiendo que Eventure es un intermediario tecnológico y no se responsabiliza
              por los eventos publicados en la plataforma.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.aceptoTerminos || !mayorEdad}
            className="w-full btn-primary py-4 disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Completar registro"}
          </button>
        </form>
      </div>
    </div>
  );
}
