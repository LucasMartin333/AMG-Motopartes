import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";

type LowStockProduct = {
  id: string;
  code: string;
  name: string;
  stock: number;
  minStock: number;
};

const LOW_STOCK_LIMIT = 8;

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const isAdmin = auth.user.role === Role.ADMIN;

  const [totalProducts, totalSuppliers, inventoryRow, lowStockCountRow, lowStockProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.supplier.count(),
      isAdmin
        ? prisma.$queryRaw<[{ value: Prisma.Decimal | null }]>`
            SELECT COALESCE(SUM(stock * "salePrice"), 0) AS value FROM "Product"
          `
        : Promise.resolve(null),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM "Product" WHERE stock <= "minStock"
      `,
      prisma.$queryRaw<LowStockProduct[]>`
        SELECT id, code, name, stock, "minStock"
        FROM "Product"
        WHERE stock <= "minStock"
        ORDER BY stock ASC, name ASC
        LIMIT ${LOW_STOCK_LIMIT}
      `,
    ]);

  const lowStockCount = Number(lowStockCountRow[0]?.count ?? 0);

  return NextResponse.json({
    totalProducts,
    ...(isAdmin && inventoryRow
      ? { inventoryValue: Number(inventoryRow[0]?.value ?? 0) }
      : {}),
    lowStockCount,
    totalSuppliers,
    lowStockProducts: lowStockProducts.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      stock: Number(p.stock),
      minStock: Number(p.minStock),
    })),
  });
}
