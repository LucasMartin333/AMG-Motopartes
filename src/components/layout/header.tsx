"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Moon, Sun, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cnLabelRole } from "@/lib/format";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";
  const initials = session?.user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

  function handleAccountClick() {
    if (isAdmin) {
      router.push("/usuarios");
      return;
    }
    setProfileOpen(true);
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

          {/* Botón siempre visible: no depende del menú del avatar */}
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

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="relative size-9 rounded-full">
                  <Avatar>
                    <AvatarFallback>{initials ?? "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{session?.user?.name}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {session?.user?.email}
                  </span>
                  {session?.user?.role ? (
                    <span className="text-muted-foreground text-xs font-normal">
                      {cnLabelRole(session.user.role)}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAccountClick}>
                <Users className="size-4" />
                {isAdmin ? "Usuarios" : "Mi perfil"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={signingOut}
                onClick={() => {
                  void handleSignOut();
                }}
              >
                <LogOut className="size-4" />
                {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mi perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Nombre</p>
              <p className="font-medium">{session?.user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium">{session?.user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Rol</p>
              <p className="font-medium">
                {session?.user?.role ? cnLabelRole(session.user.role) : "—"}
              </p>
            </div>
            <p className="text-muted-foreground border-t pt-3 text-xs">
              La gestión de usuarios está disponible solo para administradores.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
