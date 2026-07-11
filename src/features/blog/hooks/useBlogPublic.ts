import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BlogCategory, BlogPostWithCategory } from "@/features/blog/lib/types";

const PAGE_SIZE = 12;

const SELECT = `
  id, title, slug, excerpt, content_html, cover_image_url,
  author_id, category_id, status, published_at, reading_minutes,
  created_at, updated_at,
  seo_title, seo_description, seo_keywords, schema_type, og_image_url, canonical_url, noindex,
  category:blog_categories(id, name, slug),
  author:profiles(id, full_name, avatar_url)
`;


async function fetchPublishedList(page: number, categoryId?: string | null) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let q = supabase
    .from("blog_posts")
    .select(SELECT, { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(from, to);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data ?? []) as unknown as BlogPostWithCategory[], total: count ?? 0 };
}

async function fetchPostBySlug(slug: string): Promise<BlogPostWithCategory | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as BlogPostWithCategory | null;
}

async function fetchActiveCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description, is_active, seo_title, seo_description, seo_keywords, schema_type, og_image_url, canonical_url, noindex")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BlogCategory[];
}

async function fetchCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description, is_active, seo_title, seo_description, seo_keywords, schema_type, og_image_url, canonical_url, noindex")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as BlogCategory | null;
}

async function fetchRelated(categoryId: string | null, excludeId: string): Promise<BlogPostWithCategory[]> {
  if (!categoryId) return [];
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SELECT)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return (data ?? []) as unknown as BlogPostWithCategory[];
}

export const blogQueries = {
  list: (page: number, categoryId?: string | null) =>
    queryOptions({
      queryKey: ["blog", "list", page, categoryId ?? null] as const,
      queryFn: () => fetchPublishedList(page, categoryId),
    }),
  post: (slug: string) =>
    queryOptions({
      queryKey: ["blog", "post", slug] as const,
      queryFn: () => fetchPostBySlug(slug),
    }),
  categories: () =>
    queryOptions({
      queryKey: ["blog", "categories"] as const,
      queryFn: fetchActiveCategories,
    }),
  category: (slug: string) =>
    queryOptions({
      queryKey: ["blog", "category", slug] as const,
      queryFn: () => fetchCategoryBySlug(slug),
    }),
  related: (categoryId: string | null, excludeId: string) =>
    queryOptions({
      queryKey: ["blog", "related", categoryId, excludeId] as const,
      queryFn: () => fetchRelated(categoryId, excludeId),
    }),
};

export const BLOG_PAGE_SIZE = PAGE_SIZE;

export function useBlogCategoriesActive() {
  return useQuery(blogQueries.categories());
}
