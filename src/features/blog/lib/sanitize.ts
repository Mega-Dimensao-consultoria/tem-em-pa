import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza HTML para renderização segura (SSR + client).
 * Bloqueia <script>, handlers on*, javascript: em href, e limita tags/atributos.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "u", "s", "sub", "sup", "mark",
      "a", "img",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption", "span", "div",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "title",
      "src", "alt", "loading", "width", "height",
      "class",
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i,
  });
}

/** Detecta se o conteúdo é HTML (novo formato) ou markdown legado. */
export function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith("<");
}
