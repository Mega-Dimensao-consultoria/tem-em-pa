import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGrantPromotion } from "../functions/promotions.functions";
import { toast } from "sonner";
import { Loader2, Gift } from "lucide-react";

function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function AdminGrantPromotionDialog({
  open, onOpenChange, companyId, companyName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  companyName: string;
}) {
  const [startsAt, setStartsAt] = useState(todayIso(0));
  const [endsAt, setEndsAt] = useState(todayIso(30));
  const qc = useQueryClient();

  const grant = useMutation({
    mutationFn: async () => {
      const start = new Date(`${startsAt}T00:00:00`);
      const end = new Date(`${endsAt}T23:59:59`);
      const res = await adminGrantPromotion({
        data: {
          companyId,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        },
      });
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      toast.success(`Destaque concedido para ${companyName}`);
      qc.invalidateQueries({ queryKey: ["promotion"] });
      qc.invalidateQueries({ queryKey: ["companies"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao conceder destaque"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Conceder destaque (cortesia)
          </DialogTitle>
          <DialogDescription>
            Ative destaque manual para <strong>{companyName}</strong> — sem cobrança.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="starts">Início</Label>
            <Input id="starts" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ends">Fim</Label>
            <Input id="ends" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => grant.mutate()} disabled={grant.isPending}>
            {grant.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Conceder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
