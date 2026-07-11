import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

export function QrCodeCard({ url, companyName }: { url: string; companyName: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const download = () => {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-semibold">QR Code da página</h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Imprima e cole no balcão, vitrine ou cardápio. Quem escanear cai direto na sua página no Tem na minha cidade.
      </p>
      <div ref={wrapRef} className="flex flex-col items-center gap-3">
        <div className="rounded-xl bg-white p-3">
          <QRCodeCanvas value={url} size={180} level="M" includeMargin={false} />
        </div>
        <p className="break-all text-center text-[10px] text-muted-foreground">{url}</p>
        <Button size="sm" variant="outline" onClick={download} className="rounded-full">
          <Download className="mr-1 h-3 w-3" /> Baixar PNG
        </Button>
      </div>
    </div>
  );
}
