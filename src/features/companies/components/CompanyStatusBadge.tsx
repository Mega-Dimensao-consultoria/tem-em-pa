import {
  getCompanyStatusLabel,
  getCompanyStatusStyle,
} from "../lib/companyStatus";

type Props = {
  status: string;
  className?: string;
};

/** Pill badge that renders a company status with consistent label + color. */
export function CompanyStatusBadge({ status, className = "" }: Props) {
  const style = getCompanyStatusStyle(status);
  const label = getCompanyStatusLabel(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  );
}
