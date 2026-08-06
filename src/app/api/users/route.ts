import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/api-utils";
import { hashPassword } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations/auth";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)),
  );
  const search = searchParams.get("search")?.trim() ?? "";
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
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
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("Ya existe un usuario con ese email", 409);
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      passwordHash,
      role: data.role as Role,
      active: data.active,
    },
    select: userSelect,
  });

  return NextResponse.json(
    { ...user, createdAt: user.createdAt.toISOString() },
    { status: 201 },
  );
}
