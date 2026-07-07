import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) out.push(line)
      line = w
      if (out.length >= maxLines) break
    } else {
      line = (line ? line + ' ' : '') + w
    }
  }
  if (line && out.length < maxLines) out.push(line)
  if (out.length === maxLines && words.join(' ').length > out.join(' ').length) {
    out[out.length - 1] = out[out.length - 1].replace(/\.?$/, '…')
  }
  return out
}

function buildSvg(title: string, subtitle: string, company: string): string {
  const titleLines = wrap(title, 34, 3)
  const y0 = 320 - (titleLines.length - 1) * 40
  const tspans = titleLines
    .map(
      (l, i) =>
        `<tspan x="72" y="${y0 + i * 80}">${esc(l)}</tspan>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#1e40af"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="72" y="72" width="140" height="6" fill="#fbbf24"/>
  <text x="72" y="140" font-family="system-ui,Segoe UI,Roboto,sans-serif" font-size="28" fill="#e2e8f0" font-weight="600">
    Tem em Pouso Alegre · Eventos
  </text>
  <text font-family="system-ui,Segoe UI,Roboto,sans-serif" font-size="64" fill="#ffffff" font-weight="800">
    ${tspans}
  </text>
  <text x="72" y="520" font-family="system-ui,Segoe UI,Roboto,sans-serif" font-size="30" fill="#cbd5e1">
    ${esc(subtitle)}
  </text>
  <text x="72" y="565" font-family="system-ui,Segoe UI,Roboto,sans-serif" font-size="26" fill="#94a3b8">
    ${esc(company)}
  </text>
</svg>`
}

export const Route = createFileRoute('/api/public/og/event/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id
        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          )
          const { data } = await supabase
            .from('city_events')
            .select(
              'title, starts_at, location, is_active, companies:company_id(name, status)',
            )
            .eq('id', id)
            .maybeSingle()

          const event = data as
            | {
                title: string
                starts_at: string
                location: string | null
                is_active: boolean
                companies: { name: string; status: string } | null
              }
            | null

          const visible =
            event && event.is_active && event.companies?.status === 'approved'
          const title = visible ? event!.title : 'Evento em Pouso Alegre'
          const when = visible
            ? new Date(event!.starts_at).toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''
          const subtitle = visible
            ? [when, event!.location].filter(Boolean).join(' · ')
            : 'Descubra o que está acontecendo na cidade'
          const company = visible ? event!.companies!.name : 'Tem em Pouso Alegre'

          const svg = buildSvg(title, subtitle, company)
          return new Response(svg, {
            headers: {
              'Content-Type': 'image/svg+xml; charset=utf-8',
              'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
          })
        } catch {
          const svg = buildSvg(
            'Evento em Pouso Alegre',
            'Tem em Pouso Alegre',
            'temempousoalegre.com.br',
          )
          return new Response(svg, {
            headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
          })
        }
      },
    },
  },
})
