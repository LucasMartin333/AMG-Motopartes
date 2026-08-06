"use client";

import { useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
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
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const initials = session?.user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
              <DropdownMenuItem
                onClick={() => {
                  void signOut({ callbackUrl: "/login", redirect: true });
                }}
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
