import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";
import { useAuth } from "@/features/auth/use-auth";
import type { BlogCategory, BlogPost, BlogPostWithCategory, BlogStatus } from "@/features/blog/lib/types";

const LIST_KEY = ["admin", "blog", "posts"] as const;
const CATS_KEY = ["admin", "blog", "categories"] as const;

const POST_SELECT = `
  id, title, slug, excerpt, content_html, cover_image_url,
  author_id, category_id, status, published_at, reading_minutes,
  created_at, updated_at,
  category:blog_categories(id, name, slug),
  author:profiles(id, full_name, avatar_url)
`;

/* -------------------- POSTS -------------------- */

export function useAdminPosts(filter: { status?: BlogStatus | "all"; categoryId?: string | null; search?: string } = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, filter] as const,
    queryFn: async (): Promise<BlogPostWithCategory[]> => {
      let q = supabase
        .from("blog_posts")
        .select(POST_SELECT)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
      if (filter.categoryId) q = q.eq("category_id", filter.categoryId);
      if (filter.search) q = q.ilike("title", `%${filter.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as BlogPostWithCategory[];
    },
  });
}

export function useAdminPost(id: string | null) {
  return useQuery({
    queryKey: ["admin", "blog", "post", id ?? ""] as const,
    enabled: !!id,
    queryFn: async (): Promise<BlogPost | null> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BlogPost | null;
    },
  });
}

export type PostInput = {
  id?: string;
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content_html: string;
  cover_image_url?: string | null;
  category_id?: string | null;
  status: BlogStatus;
  published_at?: string | null;
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: LIST_KEY });
  qc.invalidateQueries({ queryKey: ["blog"] });
}

export function useSavePost() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: PostInput) => {
      const base = {
        title: input.title.trim(),
        excerpt: input.excerpt?.trim() || null,
        content_html: input.content_html,
        cover_image_url: input.cover_image_url || null,
        category_id: input.category_id || null,
        status: input.status,
        published_at: input.published_at || null,
      };
      // slug fica opcional: quando vazio, o trigger do banco gera automaticamente.
      const slug = input.slug?.trim();
      const payload = slug ? { ...base, slug } : base;
      if (input.id) {
        const { data, error } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", input.id)
          .select("id, slug")
          .single();
        if (error) throw error;
        return data;
      }
      // No INSERT o slug é NOT NULL — quando ausente enviamos string vazia e
      // o trigger blog_posts_before_write substitui pelo slug do título.
      const insertPayload = { ...base, slug: slug ?? "", author_id: user?.id ?? null };
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(insertPayload)
        .select("id, slug")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.id ? "Post atualizado" : "Post criado");
      invalidateAll(qc);
    },
    onError: (e: Error) => toastError(e, "Falha ao salvar post"),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post excluído");
      invalidateAll(qc);
    },
    onError: (e: Error) => toastError(e),
  });
}

export function useSetPostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BlogStatus }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      const label =
        vars.status === "published"
          ? "publicado"
          : vars.status === "draft"
            ? "movido para rascunho"
            : "arquivado";
      toast.success(`Post ${label}`);
      invalidateAll(qc);
    },
    onError: (e: Error) => toastError(e),
  });
}

/* -------------------- CATEGORIES -------------------- */

export function useAdminBlogCategories() {
  return useQuery({
    queryKey: CATS_KEY,
    queryFn: async (): Promise<BlogCategory[]> => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name, slug, description, is_active")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BlogCategory[];
    },
  });
}

export type BlogCategoryInput = {
  id?: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  is_active: boolean;
};

export function useSaveBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BlogCategoryInput) => {
      const slug = (input.slug || slugifyLocal(input.name)).trim();
      const payload = {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        is_active: input.is_active,
      };
      if (input.id) {
        const { error } = await supabase.from("blog_categories").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.id ? "Categoria atualizada" : "Categoria criada");
      qc.invalidateQueries({ queryKey: CATS_KEY });
      qc.invalidateQueries({ queryKey: ["blog", "categories"] });
    },
    onError: (e: Error) => toastError(e),
  });
}

export function useDeleteBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria excluída");
      qc.invalidateQueries({ queryKey: CATS_KEY });
      qc.invalidateQueries({ queryKey: ["blog", "categories"] });
    },
    onError: (e: Error) => toastError(e),
  });
}

function slugifyLocal(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
