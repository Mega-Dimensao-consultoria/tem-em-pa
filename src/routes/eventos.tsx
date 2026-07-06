import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar, MapPin } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { usePublicCityEvents } from '@/features/events/hooks/useCityEvents'
import { Skeleton } from '@/components/ui/skeleton'
import { NoResults } from '@/components/feedback/EmptyState'

const CANONICAL = 'https://pousoalegre.megadimensao.com.br/eventos'

export const Route = createFileRoute('/eventos')({
  head: () => ({
    meta: [
      { title: 'Eventos em Pouso Alegre — Tem em Pouso Alegre' },
      {
        name: 'description',
        content:
          'Confira os próximos eventos, promoções e novidades das empresas e profissionais de Pouso Alegre.',
      },
      { property: 'og:title', content: 'Eventos em Pouso Alegre — Tem em Pouso Alegre' },
      {
        property: 'og:description',
        content:
          'Agenda de eventos e novidades do comércio e serviços de Pouso Alegre.',
      },
      { property: 'og:url', content: CANONICAL },
    ],
    links: [{ rel: 'canonical', href: CANONICAL }],
  }),
  component: EventosPage,
})

function fmt(startsAt: string, endsAt: string | null) {
  const s = new Date(startsAt)
  const sTxt = s.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!endsAt) return sTxt
  const e = new Date(endsAt)
  const eTxt =
    s.toDateString() === e.toDateString()
      ? e.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : e.toLocaleString('pt-BR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
  return `${sTxt} → ${eTxt}`
}

function EventosPage() {
  const { data = [], isLoading } = usePublicCityEvents()

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Eventos em Pouso Alegre
          </h1>
          <p className="mt-2 text-muted-foreground">
            O que está acontecendo nas empresas e serviços da cidade.
          </p>
        </header>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <NoResults
            title="Nenhum evento no momento"
            description="Volte em breve — as empresas cadastradas publicam eventos por aqui."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((ev) => (
              <li
                key={ev.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-md"
              >
                {ev.image_url ? (
                  <img
                    src={ev.image_url}
                    alt={ev.title}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-[16/9] w-full bg-hero-gradient opacity-80" />
                )}
                <div className="p-4">
                  {ev.companies ? (
                    <Link
                      to="/empresa/$id"
                      params={{ id: ev.companies.id }}
                      className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
                    >
                      {ev.companies.name}
                    </Link>
                  ) : null}
                  <h2 className="mt-1 font-display text-base font-semibold">
                    {ev.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmt(ev.starts_at, ev.ends_at)}
                    </span>
                    {ev.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {ev.location}
                      </span>
                    ) : null}
                  </div>
                  {ev.description ? (
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {ev.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  )
}
