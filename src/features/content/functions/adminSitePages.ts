import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { toastError } from '@/lib/safe'

export type AdminSitePage = {
  slug: string
  title: string
  content_html: string
  updated_at: string
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  schema_type: string | null
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  canonical_url: string | null
  noindex: boolean
}

const KEY = ['admin', 'site-pages'] as const

const SELECT =
  'slug, title, content_html, updated_at, seo_title, seo_description, seo_keywords, schema_type, og_title, og_description, og_image_url, canonical_url, noindex'

export function useAdminSitePages() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminSitePage[]> => {
      const { data, error } = await supabase
        .from('site_pages')
        .select(SELECT)
        .order('slug', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as AdminSitePage[]
    },
  })
}

export type UpdateSitePageInput = {
  slug: string
  title: string
  content_html: string
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string | null
  schema_type?: string | null
  og_title?: string | null
  og_description?: string | null
  og_image_url?: string | null
  canonical_url?: string | null
  noindex?: boolean
}

export function useUpdateSitePage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateSitePageInput) => {
      const { slug, ...rest } = input
      const { error } = await supabase
        .from('site_pages')
        .update(rest as never)
        .eq('slug', slug)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      toast.success('Página atualizada')
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['site-page', vars.slug] })
    },
    onError: (e: Error) => toastError(e),
  })
}
