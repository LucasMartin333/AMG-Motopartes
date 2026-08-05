import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, jsonError } from "@/lib/api-utils";
import { supplierSchema } from "@/lib/validations/supplier";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)),
  );
  const search = searchParams.get("search")?.trim() ?? "";
  const skip = (page - 1) * pageSize;

  const where: Prisma.SupplierWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      select: supplierSelect,
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      updatedAt: item.updatedAt.toISOString(),
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
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;
  const supplier = await prisma.supplier.create({
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

  return NextResponse.json(
    { ...supplier, updatedAt: supplier.updatedAt.toISOString() },
    { status: 201 },
  );
}
