import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, jsonError } from "@/lib/api-utils";
import { verifyUserPassword } from "@/lib/auth";
import { deleteSaleSchema } from "@/lib/validations/sale";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    select: {
      id: true,
      total: true,
      notes: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          product: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  if (!sale) {
    return jsonError("Venta no encontrada", 404);
  }

  return NextResponse.json({
    id: sale.id,
    total: sale.total.toString(),
    notes: sale.notes,
    createdAt: sale.createdAt.toISOString(),
    user: sale.user,
    items: sale.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      subtotal: item.subtotal.toString(),
      product: item.product,
    })),
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  const body = await request.json().catch(() => ({}));
  const parsed = deleteSaleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const passwordValid = await verifyUserPassword(auth.user.id, parsed.data.password);
  if (!passwordValid) {
    return jsonError("Contraseña incorrecta", 403);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!sale) {
        throw new Error("NOT_FOUND");
      }

      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (!product) {
          throw new Error(`Producto no encontrado para el ítem vendido`);
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock + item.quantity },
        });
      }

      await tx.stockMovement.deleteMany({ where: { saleId: id } });
      await tx.sale.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return jsonError("Venta no encontrada", 404);
    }
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
