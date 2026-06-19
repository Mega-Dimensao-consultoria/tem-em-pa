import { CompanyMap } from "@/features/companies/components/CompanyMap";
import { trackEvent } from "@/lib/track";

export function CompanyMapCard({
  companyId,
  name,
  lat,
  lng,
  address,
  isPending,
}: {
  companyId: string;
  name: string;
  lat: number | null;
  lng: number | null;
  address: string;
  isPending: boolean;
}) {
  const mapsQuery = encodeURIComponent(address || name);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <CompanyMap lat={lat} lng={lng} name={name} address={address} height="h-72" />
      <div className="p-3">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => !isPending && trackEvent(companyId, "maps_click")}
          className="inline-flex w-full items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
        >
          Como chegar
        </a>
      </div>
    </div>
  );
}
