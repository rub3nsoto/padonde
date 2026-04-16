"use client";
// Modal obligatorio de verificación de edad y aceptación de términos.
// Se muestra una sola vez por dispositivo (cookie local).
// Sin ambos checks, no se puede continuar.
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";

const COOKIE_KEY = "eventure_age_verified";

export default function AgeVerificationModal() {
  const [show, setShow]         = useState(false);
  const [checkEdad, setCheckEdad]         = useState(false);
  const [checkTerminos, setCheckTerminos] = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    // Verificar si ya aceptó previamente
    const verified = localStorage.getItem(COOKIE_KEY);
    if (!verified) setShow(true);
  }, []);

  const handleConfirm = () => {
    if (!checkEdad || !checkTerminos) {
      setError("Debes confirmar ambos requisitos para continuar.");
      return;
    }
    localStorage.setItem(COOKIE_KEY, "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.95)" }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-full max-w-md"
          >
            {/* Fondo con glow */}
            <div className="relative bg-gray-950 border border-gray-800 rounded-3xl p-8 shadow-brand-lg">
              {/* Decoración de fondo */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Icono */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/30 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-brand-400" />
                </div>
              </div>

              {/* Logotipo */}
              <p className="text-center text-3xl font-black gradient-text mb-1">
                Eventure
              </p>
              <p className="text-center text-gray-400 text-sm mb-8">
                Plataforma de eventos sociales urbanos
              </p>

              {/* Aviso */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200 text-sm leading-relaxed">
                  Esta plataforma contiene contenido exclusivo para <strong>mayores de 18 años</strong>.
                  El acceso por menores está estrictamente prohibido.
                </p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={checkEdad}
                      onChange={(e) => { setCheckEdad(e.target.checked); setError(""); }}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        checkEdad
                          ? "bg-brand-500 border-brand-500"
                          : "border-gray-600 bg-gray-800 group-hover:border-brand-400"
                      }`}
                    >
                      {checkEdad && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">
                    Confirmo que tengo <strong className="text-white">18 años o más</strong> y soy responsable de la veracidad de esta declaración.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={checkTerminos}
                      onChange={(e) => { setCheckTerminos(e.target.checked); setError(""); }}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        checkTerminos
                          ? "bg-brand-500 border-brand-500"
                          : "border-gray-600 bg-gray-800 group-hover:border-brand-400"
                      }`}
                    >
                      {checkTerminos && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">
                    He leído y acepto los{" "}
                    <Link href="/legal/terminos" target="_blank" className="text-brand-400 hover:underline">
                      Términos y Condiciones
                    </Link>{" "}
                    y el{" "}
                    <Link href="/legal/privacidad" target="_blank" className="text-brand-400 hover:underline">
                      Aviso de Privacidad
                    </Link>
                    . Entiendo que Eventure es un intermediario tecnológico y no se responsabiliza por los eventos publicados.
                  </span>
                </label>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
              )}

              {/* Botón */}
              <button
                onClick={handleConfirm}
                className="w-full btn-primary text-base py-4"
              >
                Confirmar y entrar
              </button>

              <p className="text-center text-gray-600 text-xs mt-4">
                Si eres menor de edad, cierra esta página.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
