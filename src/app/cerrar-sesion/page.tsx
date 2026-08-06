"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

/**
 * Ruta de escape: fuerza cierre de sesión y vuelve a /login.
 * Útil si el menú del header no responde o quedó una cookie vieja.
 */
export default function CerrarSesionPage() {
  const [message, setMessage] = useState("Cerrando sesión...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await signOut({ redirect: false });
        if (!cancelled) setMessage("Sesión cerrada. Redirigiendo...");
      } catch {
        if (!cancelled) setMessage("Redirigiendo al login...");
      } finally {
        window.location.assign(new URL("/login", window.location.origin).href);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
