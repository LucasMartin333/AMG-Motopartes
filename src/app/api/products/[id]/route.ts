import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, jsonError } from "@/lib/api-utils";
import { productSchema } from "@/lib/validations/product";

const productSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  imageUrl: true,
  stock: true,
  minStock: true,
  salePrice: true,
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
} satisfies Prisma.ProductSelect;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });

  if (!product) {
    return jsonError("Producto no encontrado", 404);
  }

  return NextResponse.json({ ...product, salePrice: product.salePrice.toString() });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = productSchema.safeParse({
    ...body,
    stock: Number(body.stock),
    minStock: Number(body.minStock),
    salePrice: Number(body.salePrice),
  });
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        code: data.code.toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl || null,
        stock: data.stock,
        minStock: data.minStock,
        salePrice: data.salePrice,
        categoryId: data.categoryId,
        brandId: data.brandId,
      },
      select: productSelect,
    });

    return NextResponse.json({ ...product, salePrice: product.salePrice.toString() });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Ya existe un producto con ese código", 409);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Producto no encontrado", 404);
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Producto no encontrado", 404);
    }
    throw error;
  }
}
