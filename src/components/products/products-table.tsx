"use client";

import Image from "next/image";
import { AlertTriangle, Pencil, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/products";

type ProductsTableProps = {
  data: ProductListItem[];
  loading?: boolean;
  canManage?: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
  onViewSuppliers: (product: ProductListItem) => void;
};

function isCriticalStock(product: ProductListItem) {
  return product.stock <= product.minStock;
}

export function ProductsTable({
  data,
  loading,
  canManage,
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
  onEdit,
  onDelete,
  onViewSuppliers,
}: ProductsTableProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const colSpan = canManage ? 8 : 7;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Código</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32">Proveedores</TableHead>
              {canManage ? <TableHead className="w-24" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: colSpan }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data.length > 0
                ? data.map((product) => {
                    const critical = isCriticalStock(product);
                    return (
                      <TableRow
                        key={product.id}
                        className={cn(
                          critical && "bg-destructive/5 hover:bg-destructive/10",
                        )}
                      >
                        <TableCell>
                          <div className="bg-muted relative size-10 overflow-hidden rounded-md">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized
                              />
                            ) : (
                              <div className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
                                N/A
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-medium">{product.code}</span>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {product.category.name} · {product.brand.name}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                critical && "text-destructive",
                              )}
                            >
                              {product.stock}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              / {product.minStock} mín.
                            </span>
                            {critical ? (
                              <AlertTriangle className="text-destructive size-4" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(product.salePrice)}
                        </TableCell>
                        <TableCell>
                          {critical ? (
                            <Badge variant="destructive">Stock crítico</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewSuppliers(product)}
                          >
                            <Truck className="size-3.5" />
                            Ver proveedores
                          </Button>
                        </TableCell>
                        {canManage ? (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onEdit(product)}
                                aria-label="Editar"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onDelete(product)}
                                aria-label="Eliminar"
                              >
                                <Trash2 className="text-destructive size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })
                : (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="h-24 text-center">
                        No se encontraron productos
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Mostrando {from}–{to} de {total.toLocaleString("es-AR")} productos
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            Anterior
          </Button>
          <span className="text-sm tabular-nums">
            Página {page} de {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
