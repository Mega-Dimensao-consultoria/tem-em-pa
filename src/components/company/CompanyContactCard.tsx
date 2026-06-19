import { Facebook, Globe, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { trackEvent } from "@/lib/track";

type Company = {
  id: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
};

export function CompanyContactCard({
  company,
  fullAddress,
  isPending,
}: {
  company: Company;
  fullAddress: string;
  isPending: boolean;
}) {
  const track = (type: string) => {
    if (!isPending) trackEvent(company.id, type);
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="mb-3 font-display text-base font-semibold">Contato</h3>
      <ul className="space-y-2 text-sm">
        {fullAddress ? (
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            <span>{fullAddress}</span>
          </li>
        ) : null}
        {company.phone ? (
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <a
              href={`tel:${company.phone}`}
              onClick={() => track("phone_click")}
              className="hover:underline"
            >
              {company.phone}
            </a>
          </li>
        ) : null}
        {company.whatsapp ? (
          <li className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <a
              href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("whatsapp_click")}
              className="hover:underline"
            >
              {company.whatsapp}
            </a>
          </li>
        ) : null}
        {company.email ? (
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <a href={`mailto:${company.email}`} className="hover:underline">
              {company.email}
            </a>
          </li>
        ) : null}
        {company.website ? (
          <li className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("website_click")}
              className="hover:underline"
            >
              {company.website}
            </a>
          </li>
        ) : null}
        {company.instagram_url ? (
          <li className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-primary" />
            <a
              href={company.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Instagram
            </a>
          </li>
        ) : null}
        {company.facebook_url ? (
          <li className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-primary" />
            <a
              href={company.facebook_url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Facebook
            </a>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
