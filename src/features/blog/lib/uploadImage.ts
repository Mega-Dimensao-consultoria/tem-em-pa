import { supabase } from "@/integrations/supabase/client";

/** Sobe uma imagem para o bucket `blog-images` e devolve a URL pública. */
export async function uploadBlogImage(prefix: "cover" | "content", file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Arquivo não é uma imagem");
  if (file.size > 5 * 1024 * 1024) throw new Error("Imagem acima de 5 MB");
  const rawExt = file.name.split(".").pop() ?? "jpg";
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
