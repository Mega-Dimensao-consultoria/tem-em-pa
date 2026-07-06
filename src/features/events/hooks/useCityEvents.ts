import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { toastError } from '@/lib/safe'

export type CityEvent = {
  id: string
  company_id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CityEventWithCompany = CityEvent & {
  companies: { id: string; name: string; logo_url: string | null; slug?: string | null } | null
}

export const cityEventsKeys = {
  all: ['city-events'] as const,
  publicList: () => [...cityEventsKeys.all, 'public'] as const,
  byCompany: (id: string) => [...cityEventsKeys.all, 'company', id] as const,
  ownerList: (companyId: string) =>
    [...cityEventsKeys.all, 'owner', companyId] as const,
}

/** Public listing: active + not-ended events across all approved companies. */
export function usePublicCityEvents() {
  return useQuery({
    queryKey: cityEventsKeys.publicList(),
    queryFn: async (): Promise<CityEventWithCompany[]> => {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('city_events')
        .select(
          'id, company_id, title, description, starts_at, ends_at, location, image_url, is_active, created_at, updated_at, companies:company_id(id, name, logo_url)',
        )
        .eq('is_active', true)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order('starts_at', { ascending: true })
        .limit(200)
      if (error) throw error
      return (data ?? []) as unknown as CityEventWithCompany[]
    },
  })
}

/** Active events for a single company, used on the company detail page. */
export function useCompanyCityEvents(companyId: string) {
  return useQuery({
    queryKey: cityEventsKeys.byCompany(companyId),
    enabled: !!companyId,
    queryFn: async (): Promise<CityEvent[]> => {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('city_events')
        .select(
          'id, company_id, title, description, starts_at, ends_at, location, image_url, is_active, created_at, updated_at',
        )
        .eq('company_id', companyId)
        .eq('is_active', true)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order('starts_at', { ascending: true })
        .limit(20)
      if (error) throw error
      return (data ?? []) as CityEvent[]
    },
  })
}

/** Full list (including inactive/past) for the company owner. */
export function useOwnerCityEvents(companyId: string, enabled: boolean) {
  return useQuery({
    queryKey: cityEventsKeys.ownerList(companyId),
    enabled: !!companyId && enabled,
    queryFn: async (): Promise<CityEvent[]> => {
      const { data, error } = await supabase
        .from('city_events')
        .select(
          'id, company_id, title, description, starts_at, ends_at, location, image_url, is_active, created_at, updated_at',
        )
        .eq('company_id', companyId)
        .order('starts_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as CityEvent[]
    },
  })
}

export type EventInput = {
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  image_url: string | null
  is_active: boolean
}

function invalidate(qc: ReturnType<typeof useQueryClient>, companyId: string) {
  qc.invalidateQueries({ queryKey: cityEventsKeys.all })
  qc.invalidateQueries({ queryKey: cityEventsKeys.byCompany(companyId) })
  qc.invalidateQueries({ queryKey: cityEventsKeys.ownerList(companyId) })
}

export function useCreateCityEvent(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { error } = await supabase
        .from('city_events')
        .insert({ ...input, company_id: companyId })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Evento criado')
      invalidate(qc, companyId)
    },
    onError: (e: Error) => toastError(e),
  })
}

export function useUpdateCityEvent(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput & { id: string }) => {
      const { id, ...rest } = input
      const { error } = await supabase
        .from('city_events')
        .update(rest)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Evento atualizado')
      invalidate(qc, companyId)
    },
    onError: (e: Error) => toastError(e),
  })
}

export function useDeleteCityEvent(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('city_events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Evento excluído')
      invalidate(qc, companyId)
    },
    onError: (e: Error) => toastError(e),
  })
}
