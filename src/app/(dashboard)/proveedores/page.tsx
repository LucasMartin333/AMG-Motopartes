"use client";

import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Mail, Phone, Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
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
import { canManageSuppliers } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import type { SupplierListItem, SuppliersResponse } from "@/types/suppliers";

const PAGE_SIZE = 25;

async function fetchSuppliers(params: URLSearchParams): Promise<SuppliersResponse> {
  const res = await fetch(`/api/suppliers?${params.toString()}`);
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Error al cargar proveedores");
  }
  return res.json();
}

export default function ProveedoresPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canManage = canManageSuppliers(session?.user);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["suppliers", debouncedSearch, page],
    queryFn: () => fetchSuppliers(params),
    placeholderData: keepPreviousData,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    queryClient.invalidateQueries({ queryKey: ["suppliers-options"] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/suppliers/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al eliminar");
      toast.success("Proveedor eliminado");
      setDeleteTarget(null);
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  const from = !data?.total ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, data?.total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Contactos mayoristas y vínculos con productos"
      >
        {canManage ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo proveedor
          </Button>
        ) : null}
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
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
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono / WhatsApp</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Actualizado</TableHead>
              {canManage ? <TableHead className="w-24" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canManage ? 7 : 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.items.length
                ? data.items.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact ?? "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-sm">
                          {supplier.phone ? (
                            <p className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {supplier.phone}
                            </p>
                          ) : null}
                          {supplier.whatsapp ? (
                            <p className="text-muted-foreground text-xs">
                              WA: {supplier.whatsapp}
                            </p>
                          ) : null}
                          {!supplier.phone && !supplier.whatsapp ? "—" : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.email ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="size-3" />
                            {supplier.email}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{supplier._count.products}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(supplier.updatedAt)}
                      </TableCell>
                      {canManage ? (
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditing(supplier);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(supplier)}
                            >
                              <Trash2 className="text-destructive size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                : (
                    <TableRow>
                      <TableCell colSpan={canManage ? 7 : 6} className="h-24 text-center">
                        No se encontraron proveedores
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Mostrando {from}–{to} de {data?.total ?? 0} proveedores
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

      {canManage ? (
        <>
          <SupplierFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            supplier={editing}
            onSuccess={() => {
              toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
              invalidate();
            }}
          />
          <ConfirmDialog
            open={!!deleteTarget}
            onOpenChange={(o) => !o && setDeleteTarget(null)}
            title="Eliminar proveedor"
            description={
              deleteTarget
                ? `¿Eliminar "${deleteTarget.name}"? Se desvincularán sus productos asociados.`
                : undefined
            }
            confirmLabel="Eliminar"
            loading={deleting}
            onConfirm={confirmDelete}
          />
        </>
      ) : null}
    </div>
  );
}
