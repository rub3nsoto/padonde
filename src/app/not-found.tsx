import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Decoración */}
        <div className="relative inline-block mb-8">
          <div className="text-9xl font-black text-surface-600">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🌑</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-3">
          Esta noche no existe
        </h1>
        <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
          El evento o página que buscas no fue encontrado. Quizás fue cancelado
          o el link no es correcto.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/explorar" className="btn-primary">
            Explorar eventos
          </Link>
          <Link href="/" className="btn-secondary">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
