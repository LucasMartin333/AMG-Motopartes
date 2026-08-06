"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SaleDetail } from "@/types/sales";

type SaleDetailSheetProps = {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SaleDetailSheet({ saleId, open, onOpenChange }: SaleDetailSheetProps) {
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

  return (
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
