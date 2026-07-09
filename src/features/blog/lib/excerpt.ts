/** Remove tags HTML preservando espaços. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trunca conteúdo (HTML ou texto) nas primeiras N palavras, devolvendo texto puro.
 * Usado nos cards do blog junto ao botão "Continuar lendo".
 */
export function truncateWords(input: string | null | undefined, maxWords = 80): string {
  if (!input) return "";
  const text = stripHtml(input);
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/** Gera excerpt automático quando o autor não define um. */
export function autoExcerpt(content: string, maxWords = 40): string {
  return truncateWords(content, maxWords);
}
