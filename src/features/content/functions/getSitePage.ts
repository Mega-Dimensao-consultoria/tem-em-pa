import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/integrations/supabase/types'

export type SitePage = {
  slug: string
  title: string
  content_html: string
  updated_at: string
  seo_title: string | null
  seo_description: string | null
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  canonical_url: string | null
  noindex: boolean
}

export const getSitePage = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data }): Promise<SitePage | null> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data: page, error } = await supabase
      .from('site_pages')
      .select(
        'slug, title, content_html, updated_at, seo_title, seo_description, og_title, og_description, og_image_url, canonical_url, noindex',
      )
      .eq('slug', data.slug)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return page as SitePage | null
  })
