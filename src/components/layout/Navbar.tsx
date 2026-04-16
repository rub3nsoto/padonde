"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Plus, LayoutDashboard, Calendar,
  Bell, Menu, X, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationsPanel from "./NotificationsPanel";

const navLinks = [
  { href: "/explorar",   label: "Explorar",   icon: Compass },
  { href: "/mis-eventos", label: "Mis Eventos", icon: Calendar, requireAuth: true },
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, requireAuth: true },
];

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const pathname             = usePathname();
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [noLeidas, setNoLeidas]       = useState(0);

  // Detectar scroll para cambiar estilo de navbar
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Cargar count de notificaciones no leídas
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNoLeidas(d.noLeidas || 0))
      .catch(() => {});
  }, [isSignedIn]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled || mobileOpen
            ? "bg-[#1B1E2F] shadow-lg"
            : "bg-[#1B1E2F]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-shadow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-white hidden sm:block">
                Eventure
              </span>
            </Link>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks
                .filter((l) => !l.requireAuth || isSignedIn)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      pathname === link.href
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
            </div>

            {/* Acciones derecha */}
            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <>
                  {/* Crear evento */}
                  <Link href="/crear" className="hidden sm:flex btn-primary py-2 px-4 text-sm">
                    <Plus className="w-4 h-4" />
                    Crear evento
                  </Link>

                  {/* Notificaciones */}
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Bell className="w-5 h-5" />
                    {noLeidas > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                        {noLeidas > 9 ? "9+" : noLeidas}
                      </span>
                    )}
                  </button>

                  {/* Avatar de Clerk */}
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 ring-2 ring-brand-500/50",
                      },
                    }}
                  />
                </>
              ) : (
                <>
                  <SignInButton mode="redirect">
                    <button className="text-sm px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all font-medium inline-flex items-center gap-2">
                      Entrar
                    </button>
                  </SignInButton>
                  <Link href="/auth/registro" className="btn-primary py-2 px-4 text-sm">
                    Registrarse
                  </Link>
                </>
              )}

              {/* Hamburger — mobile */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-[#1B1E2F]"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks
                  .filter((l) => !l.requireAuth || isSignedIn)
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                        pathname === link.href
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  ))}
                {isSignedIn && (
                  <Link
                    href="/crear"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-500 bg-brand-500/10 border border-brand-500/20"
                  >
                    <Plus className="w-4 h-4 text-brand-500" />
                    Crear nuevo evento
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Panel de notificaciones */}
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onRead={() => setNoLeidas(0)}
      />
    </>
  );
}
