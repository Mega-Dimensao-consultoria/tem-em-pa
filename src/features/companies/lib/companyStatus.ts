/**
 * Centralized labels and visual tokens for a company's lifecycle status.
 *
 * Used by user-facing dashboards and admin tables — keep a single source so
 * "pending", "approved", etc. always render with the same copy and color.
 */
export type CompanyStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "claimed"
  | (string & {});

export const COMPANY_STATUS_LABEL: Record<string, string> = {
  approved: "Publicada",
  pending: "Pendente de aprovação",
  rejected: "Rejeitada",
  claimed: "Em reivindicação",
};

export const COMPANY_STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  claimed: "bg-sky-100 text-sky-800",
};

export function getCompanyStatusLabel(status: string): string {
  return COMPANY_STATUS_LABEL[status] ?? status;
}

export function getCompanyStatusStyle(status: string): string {
  return COMPANY_STATUS_STYLE[status] ?? "bg-muted text-foreground";
}
