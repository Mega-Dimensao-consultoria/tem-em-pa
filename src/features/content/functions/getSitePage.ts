import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/integrations/supabase/types'

export type SitePage = {
  slug: string
  title: string
  content_md: string
  updated_at: string
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
      .select('slug, title, content_md, updated_at')
      .eq('slug', data.slug)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return page as SitePage | null
  })
