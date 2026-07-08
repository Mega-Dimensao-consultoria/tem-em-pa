import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { toastError } from '@/lib/safe'

export type CityEvent = {
  id: string
  company_id: string
  city_id: string
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
  companies:
    | {
        id: string
        name: string
        logo_url: string | null
        slug?: string | null
        category_id?: string | null
        categories?: { name: string; slug: string } | null
        cities?: { name: string | null; slug: string | null } | null
        neighborhoods?: { name: string | null; slug: string | null } | null
      }
    | null
}

export const cityEventsKeys = {
  all: ['city-events'] as const,
  publicList: (cityId?: string | null) =>
    [...['city-events'] as const, 'public', cityId ?? 'all'] as const,
  byCompany: (id: string) => [...['city-events'] as const, 'company', id] as const,
  ownerList: (companyId: string) =>
    [...['city-events'] as const, 'owner', companyId] as const,
}

/** Public listing: active + not-ended events, optionally scoped to a city. */
export function usePublicCityEvents(cityId?: string | null) {
  return useQuery({
    queryKey: cityEventsKeys.publicList(cityId),
    queryFn: async (): Promise<CityEventWithCompany[]> => {
      const nowIso = new Date().toISOString()
      let query = supabase
        .from('city_events')
        .select(
          'id, company_id, city_id, title, description, starts_at, ends_at, location, image_url, is_active, created_at, updated_at, companies:company_id(id, name, logo_url, category_id, categories:category_id(name, slug), cities:city_id(name, slug), neighborhoods:neighborhood_id(name, slug))',
        )
        .eq('is_active', true)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order('starts_at', { ascending: true })
        .limit(200)
      if (cityId) query = query.eq('city_id', cityId)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as unknown as CityEventWithCompany[]
    },
  })
}

export function useCompanyCityEvents(companyId: string) {
  return useQuery({
    queryKey: cityEventsKeys.byCompany(companyId),
    enabled: !!companyId,
    queryFn: async (): Promise<CityEvent[]> => {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('city_events')
        .select(
          'id, company_id, city_id, title, description, starts_at, ends_at, location, image_url, is_active, created_at, updated_at',
        )
        .eq('company_id', companyId)
        .eq('is_active', true)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order('starts_at', { ascending: true })
        .limit(20)
      if (error) throw error
      return ((data ?? []) as CityEvent[]).filter(
        (ev) => ev.company_id === companyId,
      )
    },
  })
}

export function useOwnerCityEvents(companyId: string, enabled: boolean) {
  return useQuery({
    queryKey: cityEventsKeys.ownerList(companyId),
    enabled: !!companyId && enabled,
    queryFn: async (): Promise<CityEvent[]> => {
      const { data, error } = await supabase
        .from('city_events')
        .select(
          'id, company_id, city_id, title, description, starts_at, ends_at, location, image_url, is_active, created_at, updated_at',
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

async function getCityIdForCompany(companyId: string): Promise<string> {
  const { data, error } = await supabase
    .from('companies')
    .select('city_id')
    .eq('id', companyId)
    .maybeSingle()
  if (error) throw error
  if (!data?.city_id) throw new Error('Empresa sem cidade associada')
  return data.city_id
}

export function useCreateCityEvent(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const city_id = await getCityIdForCompany(companyId)
      const { error } = await supabase
        .from('city_events')
        .insert({ ...input, company_id: companyId, city_id })
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
