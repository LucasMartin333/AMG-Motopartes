import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, jsonError } from "@/lib/api-utils";
import { supplierSchema } from "@/lib/validations/supplier";

const supplierSelect = {
  id: true,
  name: true,
  contact: true,
  phone: true,
  whatsapp: true,
  email: true,
  address: true,
  updatedAt: true,
  _count: { select: { products: true } },
} satisfies Prisma.SupplierSelect;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: supplierSelect,
  });

  if (!supplier) {
    return jsonError("Proveedor no encontrado", 404);
  }

  return NextResponse.json({
    ...supplier,
    updatedAt: supplier.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name.trim(),
        contact: data.contact?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
      },
      select: supplierSelect,
    });

    return NextResponse.json({
      ...supplier,
      updatedAt: supplier.updatedAt.toISOString(),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Proveedor no encontrado", 404);
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  try {
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Proveedor no encontrado", 404);
    }
    throw error;
  }
}
