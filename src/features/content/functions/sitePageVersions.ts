import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { toastError } from '@/lib/safe'

export type SitePageVersion = {
  id: string
  slug: string
  title: string
  content_html: string
  saved_by: string | null
  created_at: string
}

const versionsKey = (slug: string) => ['admin', 'site-pages', 'versions', slug] as const

export function useSitePageVersions(slug: string | null) {
  return useQuery({
    queryKey: versionsKey(slug ?? ''),
    enabled: !!slug,
    queryFn: async (): Promise<SitePageVersion[]> => {
      const { data, error } = await supabase
        .from('site_pages_versions')
        .select('id, slug, title, content_html, saved_by, created_at')
        .eq('slug', slug!)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as SitePageVersion[]
    },
  })
}

export function useRestoreSitePageVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (version: SitePageVersion) => {
      const { error } = await supabase
        .from('site_pages')
        .update({ title: version.title, content_html: version.content_html })
        .eq('slug', version.slug)
      if (error) throw error
      return version
    },
    onSuccess: (v) => {
      toast.success('Versão restaurada')
      qc.invalidateQueries({ queryKey: ['admin', 'site-pages'] })
      qc.invalidateQueries({ queryKey: versionsKey(v.slug) })
      qc.invalidateQueries({ queryKey: ['site-page', v.slug] })
    },
    onError: (e: Error) => toastError(e),
  })
}

export async function uploadSitePageImage(slug: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'jpg'}`
  const { error } = await supabase.storage
    .from('site-pages-images')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('site-pages-images').getPublicUrl(path)
  return data.publicUrl
}
