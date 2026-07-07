import { Calendar, MapPin } from 'lucide-react'
import { useCompanyCityEvents } from '@/features/events/hooks/useCityEvents'
import { EventCalendarButtons } from '@/features/events/components/EventCalendarButtons'

function formatRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt)
  const startTxt = start.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!endsAt) return startTxt
  const end = new Date(endsAt)
  const sameDay =
    start.toDateString() === end.toDateString()
      ? end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : end.toLocaleString('pt-BR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
  return `${startTxt} → ${sameDay}`
}

export function CompanyEventsBlock({ companyId }: { companyId: string }) {
  const { data = [], isLoading } = useCompanyCityEvents(companyId)
  if (isLoading || data.length === 0) return null

  return (
    <section aria-labelledby="company-events-heading">
      <h2 id="company-events-heading" className="mb-3 font-display text-lg font-semibold">
        Eventos e novidades
      </h2>
      <div className="space-y-3">
        {data.map((ev) => (
          <article
            key={ev.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
          >
            {ev.image_url ? (
              <img
                src={ev.image_url}
                alt={ev.title}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            ) : null}
            <div className="p-4">
              <h3 className="font-display text-base font-semibold">{ev.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatRange(ev.starts_at, ev.ends_at)}
                </span>
                {ev.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {ev.location}
                  </span>
                ) : null}
              </div>
              {ev.description ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {ev.description}
                </p>
              ) : null}
              <div className="mt-3">
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
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
