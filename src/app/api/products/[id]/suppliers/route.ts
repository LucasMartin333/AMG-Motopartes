import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, jsonError } from "@/lib/api-utils";
import { productSupplierLinkSchema } from "@/lib/validations/supplier";

type RouteContext = { params: Promise<{ id: string }> };

const linkSelect = {
  id: true,
  supplierPrice: true,
  notes: true,
  updatedAt: true,
  createdAt: true,
  supplier: {
    select: {
      id: true,
      name: true,
      contact: true,
      phone: true,
      whatsapp: true,
      email: true,
      address: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ProductSupplierSelect;

function serializeLink(link: Prisma.ProductSupplierGetPayload<{ select: typeof linkSelect }>) {
  return {
    id: link.id,
    supplierPrice: link.supplierPrice.toString(),
    notes: link.notes,
    updatedAt: link.updatedAt.toISOString(),
    createdAt: link.createdAt.toISOString(),
    supplier: {
      ...link.supplier,
      updatedAt: link.supplier.updatedAt.toISOString(),
    },
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id: productId } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, code: true },
  });

  if (!product) {
    return jsonError("Producto no encontrado", 404);
  }

  const links = await prisma.productSupplier.findMany({
    where: { productId },
    select: linkSelect,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    product,
    links: links.map(serializeLink),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id: productId } = await context.params;
  const body = await request.json();
  const parsed = productSupplierLinkSchema.safeParse({
    ...body,
    supplierPrice: Number(body.supplierPrice),
  });

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return jsonError("Producto no encontrado", 404);
  }

  let supplierId = data.supplierId;

  if (data.newSupplier) {
    const created = await prisma.supplier.create({
      data: {
        name: data.newSupplier.name.trim(),
        contact: data.newSupplier.contact?.trim() || null,
        phone: data.newSupplier.phone?.trim() || null,
        whatsapp: data.newSupplier.whatsapp?.trim() || null,
        email: data.newSupplier.email?.trim() || null,
        address: data.newSupplier.address?.trim() || null,
      },
    });
    supplierId = created.id;
  }

  if (!supplierId) {
    return jsonError("Proveedor requerido");
  }

  try {
    const link = await prisma.productSupplier.create({
      data: {
        productId,
        supplierId,
        supplierPrice: data.supplierPrice,
        notes: data.notes?.trim() || null,
      },
      select: linkSelect,
    });

    return NextResponse.json(serializeLink(link), { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Este proveedor ya está vinculado al producto", 409);
    }
    throw error;
  }
}
