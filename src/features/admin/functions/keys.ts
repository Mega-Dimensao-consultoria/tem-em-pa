/** Centralized React Query keys for admin data. */
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  pendingCompanies: () => [...adminKeys.all, "pending-companies"] as const,
  pendingClaims: () => [...adminKeys.all, "pending-claims"] as const,
  pendingReviews: () => [...adminKeys.all, "pending-reviews"] as const,
  reports: (filter: string) => [...adminKeys.all, "review-reports", filter] as const,
  reportsRoot: () => [...adminKeys.all, "review-reports"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  categories: () => [...adminKeys.all, "categories"] as const,
  bannedWords: () => [...adminKeys.all, "banned-words"] as const,
  auditLog: () => [...adminKeys.all, "audit-log"] as const,
  pendingRemovals: () => [...adminKeys.all, "pending-removals"] as const,
};
