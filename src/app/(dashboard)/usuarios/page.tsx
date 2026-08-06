"use client";

import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, Search, Trash2, Pencil, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { UserFormDialog } from "@/components/users/user-form-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { canManageUsers } from "@/lib/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DEFAULT_AVATAR_COLOR, getInitials } from "@/lib/avatar-colors";
import { cnLabelRole, formatDate } from "@/lib/format";
import type { UserListItem, UsersResponse } from "@/types/users";

const PAGE_SIZE = 25;

async function fetchUsers(params: URLSearchParams): Promise<UsersResponse> {
  const res = await fetch(`/api/users?${params.toString()}`);
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Error al cargar usuarios");
  }
  return res.json();
}

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canManage = canManageUsers(session?.user);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users", debouncedSearch, page],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
    enabled: canManage,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al eliminar");
      toast.success("Usuario eliminado");
      setDeleteTarget(null);
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(user: UserListItem) {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          active: !user.active,
          avatarColor: user.avatarColor,
          password: "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al actualizar");
      toast.success(user.active ? "Usuario desactivado" : "Usuario activado");
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setTogglingId(null);
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-2">
        <PageHeader
          title="Usuarios"
          description="Gestión de cuentas y roles del equipo"
        />
        <p className="text-muted-foreground text-sm">No tenés permiso para ver esta sección.</p>
      </div>
    );
  }

  const from = !data?.total ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, data?.total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas y roles del equipo"
      >
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Buscar por nombre o email..."
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
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-36" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.items.length
                ? data.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm" className="pointer-events-none">
                            <AvatarFallback
                              className="text-[10px] font-semibold text-white"
                              style={{
                                backgroundColor:
                                  user.avatarColor || DEFAULT_AVATAR_COLOR,
                              }}
                            >
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{cnLabelRole(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "secondary" : "outline"}>
                          {user.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={user.active ? "Desactivar" : "Activar"}
                            disabled={togglingId === user.id}
                            onClick={() => toggleActive(user)}
                          >
                            {user.active ? (
                              <UserX className="size-4" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(user);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="text-destructive size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Mostrando {from}–{to} de {data?.total ?? 0} usuarios
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

      <UserFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSuccess={() => {
          toast.success(editing ? "Usuario actualizado" : "Usuario creado");
          invalidate();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar usuario"
        description={
          deleteTarget
            ? `¿Eliminar a "${deleteTarget.name}" (${deleteTarget.email})? Si tiene movimientos, preferí desactivar el acceso.`
            : undefined
        }
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
