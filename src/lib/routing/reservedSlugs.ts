/**
 * Guards the catch-all `/$citySlug` routes against non-city requests.
 *
 * Anything that is not a plausible city slug (asset requests like
 * `/favicon.ico`, `/ads.txt`, `/apple-touch-icon.png`, bot probes such as
 * `/wp-login.php`, etc.) used to fall through to the city routes, which ran
 * database queries and then crashed during SSR — producing 500s and, under
 * load, aborted connections ("connection reset by peer").
 *
 * These checks are pure string work: no database access, no SSR render.
 */

const RESERVED_SLUGS = new Set([
  "api",
  "assets",
  "static",
  "_serverfn",
  "_build",
  "sw",
  "service-worker",
  "workbox",
  "favicon",
  "robots",
  "sitemap",
  "manifest",
  "llms",
  "llms-full",
  "ads",
  "app-ads",
  "wp-admin",
  "wp-login",
  "wp-content",
  "wp-includes",
  "xmlrpc",
  ".well-known",
  ".env",
  "admin.php",
  "phpmyadmin",
  "cgi-bin",
  "null",
  "undefined",
]);

/**
 * True when the slug cannot be a city and the request should 404 immediately.
 */
export function isNonCitySlug(slug: string | undefined | null): boolean {
  if (!slug) return true;
  const s = slug.trim().toLowerCase();
  if (!s) return true;
  // Anything with a file extension / dot is an asset or probe, never a city.
  if (s.includes(".")) return true;
  // Control chars, encoded traversal or unexpected characters.
  if (!/^[a-z0-9\u00e0-\u00ff-]+$/.test(s)) return true;
  if (s.length > 80) return true;
  if (RESERVED_SLUGS.has(s)) return true;
  return false;
}
