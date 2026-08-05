"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cnLabelRole } from "@/lib/format";
import { allNavItems } from "@/config/navigation";

const moduleIcons = {
  "/productos": Package,
  "/proveedores": Truck,
  "/alertas": AlertTriangle,
  "/compras": ShoppingCart,
  "/ventas": Wrench,
  "/movimientos": ArrowLeftRight,
  "/usuarios": Users,
} as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const upcomingModules = allNavItems.filter(
    (item) =>
      item.href !== "/" &&
      item.phase > 1 &&
      item.href !== "/productos" &&
      item.href !== "/proveedores" &&
      (!item.adminOnly || isAdmin),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${session?.user?.name?.split(" ")[0] ?? "equipo"}`}
        description="Base del sistema lista. Los módulos de negocio se activarán en los próximos pasos."
      >
        {session?.user?.role ? (
          <Badge variant="outline">{cnLabelRole(session.user.role)}</Badge>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado del proyecto</CardTitle>
            <CardDescription>Fase 1 — Fundación</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Base lista</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Auth, layout, Prisma y seed configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tu rol</CardTitle>
            <CardDescription>Permisos de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {session?.user?.role ? cnLabelRole(session.user.role) : "—"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {isAdmin
                ? "Acceso completo incluyendo usuarios"
                : "Acceso operativo sin gestión de usuarios"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próximos módulos</CardTitle>
            <CardDescription>En desarrollo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingModules.length}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Productos, operaciones y más
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Módulos del sistema</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingModules.map((module) => {
            const Icon =
              moduleIcons[module.href as keyof typeof moduleIcons] ?? Package;

            return (
              <Link key={module.href} href={module.href}>
                <Card className="hover:border-primary/40 h-full transition-colors">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                      <Icon className="text-muted-foreground size-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{module.label}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {module.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Fase {module.phase}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
