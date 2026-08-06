"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { DEFAULT_AVATAR_COLOR, getInitials } from "@/lib/avatar-colors";
import { cnLabelRole } from "@/lib/format";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const initials = getInitials(session?.user?.name);
  const avatarColor = session?.user?.avatarColor || DEFAULT_AVATAR_COLOR;

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({ redirect: false });
      toast.success("Sesión cerrada");
    } catch {
      toast.error("No se pudo cerrar la sesión");
    } finally {
      window.location.assign(new URL("/login", window.location.origin).href);
    }
  }

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 backdrop-blur">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Inventario Motos</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 items-center justify-between">
        <div className="hidden lg:block">
          <p className="text-sm font-medium">Sistema de Inventario</p>
          <p className="text-muted-foreground text-xs">Repuestos de motocicletas</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={signingOut}
            onClick={() => {
              void handleSignOut();
            }}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">
              {signingOut ? "Cerrando..." : "Cerrar sesión"}
            </span>
            <span className="sm:hidden">{signingOut ? "..." : "Salir"}</span>
          </Button>

          <div className="flex items-center gap-2 pl-1">
            <Avatar className="pointer-events-none size-9 select-none" aria-hidden>
              <AvatarFallback
                className="text-sm font-medium text-white"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium leading-tight">
                {session?.user?.name}
              </p>
              {session?.user?.role ? (
                <p className="text-muted-foreground truncate text-xs leading-tight">
                  {cnLabelRole(session.user.role)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
