import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/api-utils";
import { getStorageBucket, getSupabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Archivo requerido");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError("Formato no permitido. Usá JPG, PNG, WebP o GIF");
    }

    if (file.size > MAX_SIZE) {
      return jsonError("La imagen no puede superar 5 MB");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const fileName = `products/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();
    const bucket = getStorageBucket();

    const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return jsonError(error.message, 500);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl });
  } catch {
    return jsonError(
      "No se pudo subir la imagen. Verificá la configuración de Supabase Storage.",
      500,
    );
  }
}
