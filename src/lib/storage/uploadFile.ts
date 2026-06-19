import { supabase } from "@/integrations/supabase/client";

export const MAX_MB = 5;
export const PRIVATE_BUCKETS = new Set(["claim-documents"]);

export function publicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function pathFromValue(bucket: string, value: string): string | null {
  if (!value.startsWith("http")) return value;
  const idx = value.indexOf(`/${bucket}/`);
  if (idx === -1) return null;
  return value.slice(idx + bucket.length + 2);
}

export function validateFile(file: File, accept: string): string | null {
  if (file.size > MAX_MB * 1024 * 1024) return `Arquivo maior que ${MAX_MB}MB.`;
  if (accept && !accept.includes("*")) {
    const exts = accept.split(",").map((s) => s.trim().toLowerCase());
    const ok = exts.some((e) =>
      e.startsWith(".")
        ? file.name.toLowerCase().endsWith(e)
        : file.type.startsWith(e.replace("*", "")),
    );
    if (!ok) return "Tipo de arquivo não permitido.";
  }
  return null;
}

export async function uploadToBucket(opts: {
  bucket: string;
  userId: string;
  file: File;
  prefix?: string;
  upsert?: boolean;
}) {
  const { bucket, userId, file, prefix = "", upsert = false } = opts;
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${prefix}${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert,
  });
  if (error) throw error;
  return path;
}

export async function removeFromBucket(bucket: string, value: string | null) {
  if (!value) return;
  const path = pathFromValue(bucket, value);
  if (path) await supabase.storage.from(bucket).remove([path]);
}
