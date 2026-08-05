import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, jsonError } from "@/lib/api-utils";
import { productSchema } from "@/lib/validations/product";
import type { StockFilter } from "@/types/products";

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

async function buildWhereClause(searchParams: URLSearchParams) {
  const search = searchParams.get("search")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const brandId = searchParams.get("brandId") ?? "";
  const stockFilter = (searchParams.get("stockFilter") ?? "all") as StockFilter;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;

  if (stockFilter === "critical") {
    const critical = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product" WHERE stock <= "minStock"
    `;
    where.id = { in: critical.map((row) => row.id) };
  } else if (stockFilter === "ok") {
    const critical = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product" WHERE stock <= "minStock"
    `;
    if (critical.length > 0) {
      where.id = { notIn: critical.map((row) => row.id) };
    }
  }

  return where;
}

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

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const { page, pageSize, skip } = parsePagination(searchParams);
  const where = await buildWhereClause(searchParams);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: [{ name: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      salePrice: item.salePrice.toString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

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
    const product = await prisma.product.create({
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

    return NextResponse.json(
      { ...product, salePrice: product.salePrice.toString() },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Ya existe un producto con ese código", 409);
    }
    throw error;
  }
}
