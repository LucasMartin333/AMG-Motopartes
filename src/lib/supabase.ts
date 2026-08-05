import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase no está configurado");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";
}
