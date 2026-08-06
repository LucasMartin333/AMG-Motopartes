"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaleDeleteDialog } from "@/components/sales/sale-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SaleDetail } from "@/types/sales";

type SaleDetailSheetProps = {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canDelete?: boolean;
  onDeleted?: () => void;
};

export function SaleDetailSheet({
  saleId,
  open,
  onOpenChange,
  canDelete,
  onDeleted,
}: SaleDetailSheetProps) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: async () => {
      const res = await fetch(`/api/sales/${saleId}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al cargar la venta");
      }
      return res.json() as Promise<SaleDetail>;
    },
    enabled: open && !!saleId,
  });

  async function handleDelete(password: string) {
    if (!saleId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al eliminar la venta");
      }

      toast.success("Venta eliminada y stock restaurado");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setDeleteOpen(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      throw error;
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle de venta</SheetTitle>
            <SheetDescription>
              {data ? formatDate(data.createdAt) : "Cargando..."}
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError || !data ? (
            <p className="text-destructive mt-6 text-sm">No se pudo cargar la venta</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Registrada por</p>
                  <p className="font-medium">{data.user.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(data.total)}</p>
                </div>
              </div>

              {data.notes ? (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Notas</p>
                    <p className="text-sm">{data.notes}</p>
                  </div>
                </>
              ) : null}

              <Separator />

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">P. unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {item.product.code}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {canDelete ? (
                <>
                  <Separator />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Eliminar venta
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SaleDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        saleLabel={data?.user.name}
        saleTotal={data?.total}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
