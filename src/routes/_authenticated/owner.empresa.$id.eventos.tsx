import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Pencil, Trash2, Calendar, MapPin } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/features/auth/use-auth'
import { queryKeys } from '@/lib/queryKeys'
import { ConfirmDestructive } from '@/components/ConfirmDestructive'
import { EmptyState } from '@/components/feedback/EmptyState'
import {
  useOwnerCityEvents,
  useDeleteCityEvent,
  type CityEvent,
} from '@/features/events/hooks/useCityEvents'
import { EventFormDialog } from '@/features/events/components/EventFormDialog'

export const Route = createFileRoute('/_authenticated/owner/empresa/$id/eventos')({
  head: () => ({ meta: [{ title: 'Eventos — Tem na cidade' }] }),
  component: EventosOwnerPage,
})

function EventosOwnerPage() {
  const { id } = Route.useParams()
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CityEvent | null>(null)

  const company = useQuery({
    queryKey: queryKeys.owner.companyAny(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, owner_id')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const isOwner = !!user && company.data?.owner_id === user.id
  const events = useOwnerCityEvents(id, isOwner)
  const del = useDeleteCityEvent(id)

  if (!company.isLoading && (!company.data || !isOwner)) throw notFound()

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/owner/empresa/$id/dashboard" params={{ id }}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Eventos e novidades
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Publique eventos, promoções ou datas especiais da sua empresa.
              Aparecem na sua página e no catálogo público de eventos.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </Button>
        </div>

        <div className="mt-8 space-y-3">
          {events.isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Carregando…
            </div>
          ) : (events.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title="Nenhum evento ainda"
              description="Clique em 'Novo evento' para criar o primeiro."
            />
          ) : (
            (events.data ?? []).map((ev) => (
              <article
                key={ev.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row"
              >
                {ev.image_url ? (
                  <img
                    src={ev.image_url}
                    alt=""
                    className="h-24 w-full rounded-lg object-cover sm:w-32"
                  />
                ) : null}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold">
                      {ev.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        ev.is_active
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {ev.is_active ? 'publicado' : 'oculto'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(ev.starts_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {ev.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {ev.location}
                      </span>
                    ) : null}
                  </div>
                  {ev.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {ev.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(ev)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <ConfirmDestructive
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                    title="Excluir evento?"
                    description={<p>Esta ação não pode ser desfeita.</p>}
                    onConfirm={() => del.mutate(ev.id)}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {user && company.data ? (
        <EventFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          companyId={id}
          userId={user.id}
          event={editing}
        />
      ) : null}
    </PageShell>
  )
}
