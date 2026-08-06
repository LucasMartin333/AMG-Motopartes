import { NextRequest, NextResponse } from "next/server";
import { MovementType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError } from "@/lib/api-utils";
import { createSaleSchema } from "@/lib/validations/sale";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function buildWhere(search: string): Prisma.SaleWhereInput {
  const term = search.trim();
  if (!term) return {};

  return {
    OR: [
      { notes: { contains: term, mode: "insensitive" } },
      { user: { name: { contains: term, mode: "insensitive" } } },
      {
        items: {
          some: {
            product: {
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { code: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ],
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const { page, pageSize, skip } = parsePagination(searchParams);
  const where = buildWhere(searchParams.get("search") ?? "");

  const [rows, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        total: true,
        notes: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      total: row.total.toString(),
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      itemCount: row._count.items,
      user: row.user,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createSaleSchema.safeParse({
    notes: body.notes,
    items: Array.isArray(body.items)
      ? body.items.map((item: { productId: string; quantity: unknown; unitPrice: unknown }) => ({
          productId: String(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }))
      : [],
  });

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { notes, items } = parsed.data;

  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const productIds = [...qtyByProduct.keys()];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, code: true, stock: true },
      });

      if (products.length !== productIds.length) {
        throw new Error("Uno o más productos no existen");
      }

      for (const [productId, qty] of qtyByProduct) {
        const product = products.find((p) => p.id === productId)!;
        if (product.stock < qty) {
          throw new Error(
            `Stock insuficiente para "${product.name}" (${product.code}): disponible ${product.stock}, solicitado ${qty}`,
          );
        }
      }

      const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      const created = await tx.sale.create({
        data: {
          userId: auth.user.id,
          notes: notes?.trim() || null,
          total,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          items: true,
          user: { select: { id: true, name: true } },
        },
      });

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        const previousStock = product.stock;
        const newStock = previousStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        product.stock = newStock;

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: auth.user.id,
            type: MovementType.SALE,
            quantity: item.quantity,
            previousStock,
            newStock,
            saleId: created.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        id: sale.id,
        total: sale.total.toString(),
        createdAt: sale.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
