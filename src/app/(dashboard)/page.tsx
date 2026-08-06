"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { canViewInventoryValue } from "@/lib/permissions";
import { allNavItems } from "@/config/navigation";
import type { DashboardStats } from "@/types/dashboard";

const moduleIcons = {
  "/productos": Package,
  "/proveedores": Truck,
  "/alertas": AlertTriangle,
  "/compras": ShoppingCart,
  "/ventas": Wrench,
  "/movimientos": ArrowLeftRight,
  "/usuarios": Users,
} as const;

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Error al cargar el resumen");
  }
  return res.json();
}

export default function PrincipalPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const showInventoryValue = canViewInventoryValue(session?.user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const modules = allNavItems.filter(
    (item) => item.href !== "/" && (!item.adminOnly || isAdmin),
  );

  const firstName = session?.user?.name?.split(" ")[0] ?? "equipo";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${firstName}`}
        description="Resumen de tu inventario de repuestos"
      />

      <div
        className={`grid gap-4 sm:grid-cols-2 ${showInventoryValue ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
      >
        <KpiCard
          title="Total de productos"
          loading={isLoading}
          value={data ? String(data.totalProducts) : "—"}
          hint="En el catálogo"
        />
        {showInventoryValue ? (
          <KpiCard
            title="Valor del inventario"
            loading={isLoading}
            value={
              data?.inventoryValue != null ? formatCurrency(data.inventoryValue) : "—"
            }
            hint="Stock × precio de venta"
          />
        ) : null}
        <Link href="/alertas" className="block">
          <Card className="hover:border-primary/40 h-full transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Productos en alerta</CardTitle>
              <CardDescription>Stock bajo el mínimo</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p
                  className={`text-2xl font-bold ${
                    (data?.lowStockCount ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : ""
                  }`}
                >
                  {data?.lowStockCount ?? "—"}
                </p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">Ver alertas →</p>
            </CardContent>
          </Card>
        </Link>
        <KpiCard
          title="Proveedores"
          loading={isLoading}
          value={data ? String(data.totalSuppliers) : "—"}
          hint="Registrados"
        />
      </div>

      {isError ? (
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "No se pudo cargar el resumen"}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Stock bajo mínimo</h2>
          <Link
            href="/alertas"
            className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.lowStockProducts.length
                  ? data.lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.code}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right text-amber-600 dark:text-amber-400">
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {product.minStock}
                        </TableCell>
                      </TableRow>
                    ))
                  : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground h-20 text-center">
                          No hay productos en alerta
                        </TableCell>
                      </TableRow>
                    )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon =
              moduleIcons[module.href as keyof typeof moduleIcons] ?? Package;

            return (
              <Link key={module.href} href={module.href}>
                <Card className="hover:border-primary/40 group h-full transition-colors">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="bg-muted group-hover:bg-primary/10 flex size-10 items-center justify-center rounded-lg transition-colors">
                      <Icon className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{module.label}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {module.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  loading,
}: {
  title: string;
  value: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{value}</p>}
      </CardContent>
    </Card>
  );
}
