/** Barrel for companies server functions. */
export { listFeaturedCompanies } from "./featured";
export { searchCompanies } from "./search";
export { listSimilarCompanies } from "./similar";
export { getCategoryBySlug } from "./categoryBySlug";
export { listCompaniesByNeighborhood } from "./listByNeighborhood";
export { checkCompanyDuplicate, type DuplicateMatch } from "./checkDuplicate";
export {
  listActiveCities,
  getCityBySlug,
  getDefaultCity,
  listNeighborhoodsByCity,
  getNeighborhoodBySlug,
  type City,
  type Neighborhood,
} from "@/features/cities/functions/list";
