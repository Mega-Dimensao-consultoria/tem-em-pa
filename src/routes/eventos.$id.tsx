import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Calendar, MapPin, ArrowLeft } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { supabase } from '@/integrations/supabase/client'
import { EventCalendarButtons } from '@/features/events/components/EventCalendarButtons'
import { ShareButton } from '@/components/ShareButton'

type LoadedEvent = {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  image_url: string | null
  company: { id: string; name: string; logo_url: string | null } | null
}

async function loadEvent(id: string): Promise<LoadedEvent> {
  const { data, error } = await supabase
    .from('city_events')
    .select(
      'id, title, description, starts_at, ends_at, location, image_url, is_active, companies:company_id(id, name, logo_url, status)',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  const row = data as
    | {
        id: string
        title: string
        description: string | null
        starts_at: string
        ends_at: string | null
        location: string | null
        image_url: string | null
        is_active: boolean
        companies: { id: string; name: string; logo_url: string | null; status: string } | null
      }
    | null
  if (!row || !row.is_active || row.companies?.status !== 'approved') {
    throw notFound()
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    location: row.location,
    image_url: row.image_url,
    company: row.companies
      ? { id: row.companies.id, name: row.companies.name, logo_url: row.companies.logo_url }
      : null,
  }
}

export const Route = createFileRoute('/eventos/$id')({
  loader: ({ params }) => loadEvent(params.id),
  head: ({ params, loaderData }) => {
    const base = 'https://www.temnaminhacidade.com.br'
    const url = `${base}/eventos/${params.id}`
    const title = loaderData?.title
      ? `${loaderData.title} — Eventos — Tem na minha cidade`
      : 'Evento — Tem na minha cidade'
    const when = loaderData
      ? new Date(loaderData.starts_at).toLocaleString('pt-BR', {
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''
    const description = loaderData
      ? [when, loaderData.location, loaderData.company?.name]
          .filter(Boolean)
          .join(' · ')
          .slice(0, 160)
      : 'Agenda de eventos das cidades atendidas.'
    const ogImage =
      loaderData?.image_url ?? `${base}/api/public/og/event/${params.id}`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: ogImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: ogImage },
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: loaderData
        ? [
            {
              type: 'application/ld+json',
              children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: loaderData.title,
                startDate: loaderData.starts_at,
                endDate: loaderData.ends_at ?? undefined,
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode:
                  'https://schema.org/OfflineEventAttendanceMode',
                location: loaderData.location
                  ? { '@type': 'Place', name: loaderData.location }
                  : undefined,
                image: ogImage,
                organizer: loaderData.company
                  ? { '@type': 'Organization', name: loaderData.company.name }
                  : undefined,
              }),
            },
          ]
        : [],
    }
  },
  component: EventDetailPage,
  errorComponent: ({ error }) => (
    <PageShell>
      <div role="alert" className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Não foi possível carregar o evento</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Evento não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O evento pode ter sido removido ou não está mais ativo.
        </p>
        <Link
          to="/eventos"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Ver todos os eventos
        </Link>
      </div>
    </PageShell>
  ),
})

function EventDetailPage() {
  const ev = Route.useLoaderData()
  const when = new Date(ev.starts_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <PageShell>
      <article
        aria-labelledby="event-title"
        className="mx-auto max-w-3xl px-4 py-8"
      >
        <Link
          to="/eventos"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Voltar aos eventos
        </Link>

        {ev.image_url ? (
          <img
            src={ev.image_url}
            alt={ev.title}
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="aspect-[16/9] w-full rounded-2xl bg-hero-gradient opacity-80" aria-hidden="true" />
        )}

        <header className="mt-6">
          {ev.company ? (
            <Link
              to="/empresa/$id"
              params={{ id: ev.company.id }}
              className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
            >
              {ev.company.name}
            </Link>
          ) : null}
          <h1 id="event-title" className="mt-1 font-display text-3xl font-bold md:text-4xl">
            {ev.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" aria-hidden="true" /> {when}
            </span>
            {ev.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {ev.location}
              </span>
            ) : null}
          </div>
        </header>

        {ev.description ? (
          <section aria-label="Descrição" className="mt-6 whitespace-pre-wrap text-base leading-relaxed">
            {ev.description}
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <EventCalendarButtons
            event={{
              uid: ev.id,
              title: ev.title,
              description: ev.description,
              location: ev.location,
              startsAt: ev.starts_at,
              endsAt: ev.ends_at,
            }}
          />
          <ShareButton
            title={ev.title}
            text={`Confira: ${ev.title}`}
            url={`https://www.temnaminhacidade.com.br/eventos/${ev.id}`}
          />
        </div>
      </article>
    </PageShell>
  )
}
