import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/api-utils";
import { hashPassword } from "@/lib/auth";
import { userSchema } from "@/lib/validations/auth";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  avatarColor: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type RouteContext = { params: Promise<{ id: string }> };

async function countActiveAdmins(excludeId?: string) {
  return prisma.user.count({
    where: {
      role: Role.ADMIN,
      active: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

async function wouldRemoveLastActiveAdmin(
  target: { id: string; role: Role; active: boolean },
  next: { role?: Role; active?: boolean },
) {
  const willBeActiveAdmin =
    (next.role ?? target.role) === Role.ADMIN &&
    (next.active ?? target.active) === true;

  if (target.role === Role.ADMIN && target.active && !willBeActiveAdmin) {
    const remaining = await countActiveAdmins(target.id);
    return remaining === 0;
  }
  return false;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    return jsonError("Usuario no encontrado", 404);
  }

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Usuario no encontrado", 404);
  }

  const nextRole = data.role as Role;
  const nextActive = data.active;

  if (
    await wouldRemoveLastActiveAdmin(
      { id: existing.id, role: existing.role, active: existing.active },
      { role: nextRole, active: nextActive },
    )
  ) {
    return jsonError(
      "No se puede desactivar o degradar al último administrador activo",
      400,
    );
  }

  if (
    auth.user.id === id &&
    existing.role === Role.ADMIN &&
    existing.active &&
    (nextRole !== Role.ADMIN || !nextActive)
  ) {
    return jsonError(
      "No podés desactivar o cambiar el rol de tu propia cuenta de administrador",
      400,
    );
  }

  const email = data.email.toLowerCase().trim();
  if (email !== existing.email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) {
      return jsonError("Ya existe un usuario con ese email", 409);
    }
  }

  const password = data.password?.trim();
  const updateData: Prisma.UserUpdateInput = {
    name: data.name.trim(),
    email,
    role: nextRole,
    active: nextActive,
    avatarColor: data.avatarColor,
  };

  if (password) {
    updateData.passwordHash = await hashPassword(password);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Usuario no encontrado", 404);
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  if (auth.user.id === id) {
    return jsonError("No podés eliminar tu propia cuenta", 400);
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Usuario no encontrado", 404);
  }

  if (
    await wouldRemoveLastActiveAdmin(
      { id: existing.id, role: existing.role, active: existing.active },
      { role: Role.EMPLOYEE, active: false },
    )
  ) {
    return jsonError("No se puede eliminar al último administrador activo", 400);
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Usuario no encontrado", 404);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return jsonError(
        "No se puede eliminar: el usuario tiene movimientos asociados. Desactivá el acceso en su lugar.",
        409,
      );
    }
    throw error;
  }
}
