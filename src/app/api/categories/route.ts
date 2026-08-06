import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, jsonError } from "@/lib/api-utils";
import { catalogNameSchema } from "@/lib/validations/catalog";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = catalogNameSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    const category = await prisma.category.create({
      data: { name: parsed.data.name },
      select: { id: true, name: true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Ya existe una categoría con ese nombre", 409);
    }
    throw error;
  }
}
