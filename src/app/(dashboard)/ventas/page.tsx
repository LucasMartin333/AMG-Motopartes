"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Eye, Plus, Search, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SaleDetailSheet } from "@/components/sales/sale-detail-sheet";
import { SalePosSheet } from "@/components/sales/sale-pos-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SalesResponse } from "@/types/sales";

const PAGE_SIZE = 25;

async function fetchSales(params: URLSearchParams): Promise<SalesResponse> {
  const res = await fetch(`/api/sales?${params.toString()}`);
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Error al cargar ventas");
  }
  return res.json();
}

export default function VentasPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [posOpen, setPosOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["sales", debouncedSearch, page],
    queryFn: () => fetchSales(params),
    placeholderData: keepPreviousData,
  });

  function openDetail(id: string) {
    setDetailId(id);
    setDetailOpen(true);
  }

  const from = !data?.total ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, data?.total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Registro rápido de salidas de repuestos con descuento automático de stock"
      >
        <Button size="lg" onClick={() => setPosOpen(true)}>
          <Plus className="size-4" />
          Registrar venta
        </Button>
      </PageHeader>

      <div className="bg-muted/30 flex items-center gap-3 rounded-lg border px-4 py-3">
        <ShoppingCart className="text-primary size-5 shrink-0" />
        <p className="text-muted-foreground text-sm">
          Buscá productos por código o nombre, confirmá el ticket y el stock se actualiza al
          instante.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Buscar ventas por producto, vendedor o notas..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-center">Ítems</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.items.length
                ? data.items.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(sale.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{sale.user.name}</TableCell>
                      <TableCell className="text-center">{sale.itemCount}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                        {sale.notes ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Ver detalle"
                          onClick={() => openDetail(sale.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                        No se encontraron ventas
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Mostrando {from}–{to} de {data?.total ?? 0} ventas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {page} de {Math.max(data?.totalPages ?? 1, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= (data?.totalPages ?? 1) || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <SalePosSheet
        open={posOpen}
        onOpenChange={setPosOpen}
        onSuccess={() => {
          void refetch();
        }}
      />

      <SaleDetailSheet
        saleId={detailId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailId(null);
        }}
      />
    </div>
  );
}
