export type BlogStatus = "draft" | "published" | "archived";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean | null;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string;
  cover_image_url: string | null;
  author_id: string | null;
  category_id: string | null;
  status: BlogStatus;
  published_at: string | null;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
};


export type BlogPostWithCategory = BlogPost & {
  category: Pick<BlogCategory, "id" | "name" | "slug"> | null;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
};
