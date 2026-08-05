import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string; linkId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id: productId, linkId } = await context.params;

  try {
    const link = await prisma.productSupplier.findFirst({
      where: { id: linkId, productId },
    });

    if (!link) {
      return jsonError("Vínculo no encontrado", 404);
    }

    await prisma.productSupplier.delete({ where: { id: linkId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Vínculo no encontrado", 404);
    }
    throw error;
  }
}
