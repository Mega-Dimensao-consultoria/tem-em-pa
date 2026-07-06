import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/upload/ImageUpload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useCreateCityEvent,
  useUpdateCityEvent,
  type CityEvent,
  type EventInput,
} from '@/features/events/hooks/useCityEvents'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  userId: string
  event?: CityEvent | null
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export function EventFormDialog({
  open,
  onOpenChange,
  companyId,
  userId,
  event,
}: Props) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.starts_at))
  const [endsAt, setEndsAt] = useState(toLocalInput(event?.ends_at ?? null))
  const [location, setLocation] = useState(event?.location ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(event?.image_url ?? null)
  const [isActive, setIsActive] = useState(event?.is_active ?? true)

  const createM = useCreateCityEvent(companyId)
  const updateM = useUpdateCityEvent(companyId)
  const pending = createM.isPending || updateM.isPending

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !startsAt) return
    const payload: EventInput = {
      title: title.trim(),
      description: description.trim() || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      location: location.trim() || null,
      image_url: imageUrl,
      is_active: isActive,
    }
    const onSuccess = () => onOpenChange(false)
    if (event) {
      updateM.mutate({ ...payload, id: event.id }, { onSuccess })
    } else {
      createM.mutate(payload, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Editar evento' : 'Novo evento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="ev-title">Título *</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              required
            />
          </div>

          <div>
            <Label htmlFor="ev-desc">Descrição</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ev-start">Início *</Label>
              <Input
                id="ev-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ev-end">Fim (opcional)</Label>
              <Input
                id="ev-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ev-loc">Local (opcional)</Label>
            <Input
              id="ev-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Endereço ou nome do espaço"
              maxLength={200}
            />
          </div>

          <div>
            <Label>Imagem (opcional)</Label>
            <ImageUpload
              bucket="product-images"
              userId={userId}
              value={imageUrl}
              onChange={setImageUrl}
              label="Capa do evento"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ev-active" className="cursor-pointer">
                Publicar no catálogo
              </Label>
              <p className="text-xs text-muted-foreground">
                Se desativar, o evento fica apenas no seu painel.
              </p>
            </div>
            <Switch
              id="ev-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event ? 'Salvar' : 'Criar evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
