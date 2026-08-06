import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError } from "@/lib/api-utils";

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
