/**
 * Centralized React Query keys for non-admin domains.
 * Use these instead of inline arrays to keep invalidation consistent.
 */
export const queryKeys = {
  categories: () => ["categories"] as const,

  companies: {
    all: ["companies"] as const,
    featured: () => ["companies", "featured"] as const,
    public: (id: string) => ["company-public", id] as const,
    private: (id: string) => ["company-private", id] as const,
    edit: (id: string) => ["company-edit", id] as const,
    similar: (id: string, categoryId?: string | null, neighborhood?: string | null) =>
      ["similar-companies", id, categoryId ?? null, neighborhood ?? null] as const,
    search: (q: string, cat: string, sort: string, userId: string) =>
      ["search", q, cat, sort, userId] as const,
    byCategory: (slug: string) => ["category", slug] as const,
    categoryMeta: (slug: string) => ["category-meta", slug] as const,
  },

  owner: {
    company: (id: string, userId?: string) => ["owner-company", id, userId ?? "anon"] as const,
    companyAny: (id: string) => ["owner-company", id] as const,
    events: (id: string, periodDays: number) => ["company-events", id, periodDays] as const,
    reviews: (id: string) => ["owner-reviews", id] as const,
    products: (id: string) => ["owner-products", id] as const,
    myCompanies: (userId: string | undefined) =>
      ["owner", "my-companies", userId ?? "anon"] as const,
  },

  profile: {
    me: (userId: string | undefined) => ["profile", userId ?? "anon"] as const,
  },

  reviews: {
    mine: (userId: string | undefined) =>
      ["reviews", "mine", userId ?? "anon"] as const,
  },

  favorites: {
    mine: (userId: string | undefined) =>
      ["favorites", userId ?? "anon"] as const,
  },

  notifications: (userId: string | undefined, limit: number) =>
    ["notifications", userId ?? "anon", limit] as const,
  notificationsRoot: () => ["notifications"] as const,
};
