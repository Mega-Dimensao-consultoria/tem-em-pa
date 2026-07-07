import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

type Prefs = {
  notify_new_review: boolean
  notify_new_claim: boolean
  min_review_rating: number
}

const DEFAULTS: Prefs = {
  notify_new_review: true,
  notify_new_claim: true,
  min_review_rating: 5,
}

export function AlertPrefsCard({
  companyId,
  userId,
}: {
  companyId: string
  userId: string
}) {
  const qc = useQueryClient()
  const queryKey = ['owner-alert-prefs', companyId, userId] as const

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Prefs> => {
      const { data, error } = await supabase
        .from('owner_alert_prefs')
        .select('notify_new_review, notify_new_claim, min_review_rating')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle()
      if (error) throw error
      return (data as Prefs | null) ?? DEFAULTS
    },
  })

  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  useEffect(() => {
    if (data) setPrefs(data)
  }, [data])

  const save = useMutation({
    mutationFn: async (next: Prefs) => {
      const { error } = await supabase.from('owner_alert_prefs').upsert(
        {
          user_id: userId,
          company_id: companyId,
          ...next,
        },
        { onConflict: 'user_id,company_id' },
      )
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Preferências salvas')
      qc.invalidateQueries({ queryKey })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <section
      aria-labelledby="alert-prefs-title"
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <header className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="alert-prefs-title" className="font-display text-base font-semibold">
          Alertas por notificação
        </h2>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="pref-review" className="text-sm">
              Avisar sobre novas avaliações
            </Label>
            <Switch
              id="pref-review"
              checked={prefs.notify_new_review}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, notify_new_review: v }))}
            />
          </div>

          <div>
            <Label htmlFor="pref-min-rating" className="text-sm">
              Só avisar se a nota for até
            </Label>
            <div className="mt-2 flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={prefs.min_review_rating === n}
                  onClick={() => setPrefs((p) => ({ ...p, min_review_rating: n }))}
                  disabled={!prefs.notify_new_review}
                  className={`h-8 min-w-[36px] rounded-full px-2 text-xs font-semibold transition disabled:opacity-40 ${
                    prefs.min_review_rating === n
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/70'
                  }`}
                >
                  ≤ {n}★
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ex.: escolha "≤ 3★" para receber alerta apenas de avaliações críticas.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="pref-claim" className="text-sm">
              Avisar sobre pedidos de reivindicação
            </Label>
            <Switch
              id="pref-claim"
              checked={prefs.notify_new_claim}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, notify_new_claim: v }))}
            />
          </div>

          <Button
            size="sm"
            onClick={() => save.mutate(prefs)}
            disabled={save.isPending}
          >
            {save.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Salvar preferências
          </Button>
        </div>
      )}
    </section>
  )
}
