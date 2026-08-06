"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  createUserSchema,
  userSchema,
  type CreateUserInput,
} from "@/lib/validations/auth";
import {
  AVATAR_COLORS,
  DEFAULT_AVATAR_COLOR,
  getInitials,
  isAvatarColor,
  type AvatarColor,
} from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import type { UserListItem } from "@/types/users";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserListItem | null;
  onSuccess: () => void;
};

const emptyValues: CreateUserInput = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  active: true,
  avatarColor: DEFAULT_AVATAR_COLOR,
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const isEditing = !!user;
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(
      isEditing ? userSchema : createUserSchema,
    ) as Resolver<CreateUserInput>,
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;

    setShowPassword(false);
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        active: user.active,
        avatarColor: isAvatarColor(user.avatarColor)
          ? user.avatarColor
          : DEFAULT_AVATAR_COLOR,
      });
    } else {
      form.reset(emptyValues);
    }
  }, [open, user, form]);

  const watchedName = form.watch("name");
  const watchedColor = form.watch("avatarColor");

  async function onSubmit(values: CreateUserInput) {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      active: values.active,
      avatarColor: values.avatarColor,
      password: values.password?.trim() ?? "",
    };

    const res = await fetch(isEditing ? `/api/users/${user!.id}` : "/api/users", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error ?? "Error al guardar");
    }

    onOpenChange(false);
    onSuccess();
    return json;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
        </DialogHeader>

        <form
          key={user?.id ?? "new"}
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await onSubmit(values);
            } catch (error) {
              form.setError("root", {
                message: error instanceof Error ? error.message : "Error al guardar",
              });
            }
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="off" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? "Nueva contraseña (opcional)" : "Contraseña temporal"}
            </Label>
            <InputGroup className="h-9">
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...form.register("password")}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {form.formState.errors.password ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value) =>
                  form.setValue("role", (value as "ADMIN" | "EMPLOYEE") ?? "EMPLOYEE", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role ? (
                <p className="text-destructive text-xs">{form.formState.errors.role.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.watch("active") ? "active" : "inactive"}
                onValueChange={(value) =>
                  form.setValue("active", value === "active", { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Color del avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback
                  className="text-sm font-semibold text-white"
                  style={{ backgroundColor: watchedColor }}
                >
                  {getInitials(watchedName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => {
                  const selected = watchedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={`Color ${color}`}
                      aria-pressed={selected}
                      className={cn(
                        "size-7 rounded-full border-2 transition-transform",
                        selected
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        form.setValue("avatarColor", color as AvatarColor, {
                          shouldValidate: true,
                        })
                      }
                    />
                  );
                })}
              </div>
            </div>
            {form.formState.errors.avatarColor ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.avatarColor.message}
              </p>
            ) : null}
          </div>

          {form.formState.errors.root ? (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
