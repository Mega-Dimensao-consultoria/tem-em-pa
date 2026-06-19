/**
 * Barrel re-export for backwards compatibility.
 * New code should import directly from `@/lib/companies/<name>.functions`.
 */
export { listFeaturedCompanies } from "./companies/featured.functions";
export { searchCompanies } from "./companies/search.functions";
export { getCompanyById } from "./companies/getById.functions";
export { listSimilarCompanies } from "./companies/similar.functions";
export { getCategoryBySlug } from "./companies/categoryBySlug.functions";
