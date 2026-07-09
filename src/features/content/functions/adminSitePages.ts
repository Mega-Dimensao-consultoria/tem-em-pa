import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { toastError } from '@/lib/safe'

export type AdminSitePage = {
  slug: string
  title: string
  content_html: string
  updated_at: string
}

const KEY = ['admin', 'site-pages'] as const

export function useAdminSitePages() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminSitePage[]> => {
      const { data, error } = await supabase
        .from('site_pages')
        .select('slug, title, content_html, updated_at')
        .order('slug', { ascending: true })
      if (error) throw error
      return (data ?? []) as AdminSitePage[]
    },
  })
}

export function useUpdateSitePage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { slug: string; title: string; content_html: string }) => {
      const { error } = await supabase
        .from('site_pages')
        .update({ title: input.title, content_html: input.content_html })
        .eq('slug', input.slug)
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
