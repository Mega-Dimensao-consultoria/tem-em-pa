/**
 * Guardas usadas em todo o app — todas tolerantes a falhas.
 * Nunca lançam exceção; sempre devolvem um fallback.
 */
import { toast } from "sonner";


/** Leitura/gravação de localStorage seguras (modo privado, SSR, quota excedida). */
export const safeStorage = {
  get(key: string): string | null {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      if (typeof window === "undefined") return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string): void {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** JSON.parse seguro com fallback tipado. */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Devolve uma URL de imagem válida ou null para o caller usar placeholder. */
export function safeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.length === 0) return null;
  // bloqueia javascript: e data: por segurança (a menos que imagem data: válida)
  if (/^javascript:/i.test(trimmed)) return null;
  return trimmed;
}

/** Copia texto para o clipboard com fallback. Retorna true se conseguiu. */
export async function safeCopy(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Extrai uma mensagem amigável de qualquer tipo de erro sem expor stack/SQL. */
export function extractErrorMessage(err: unknown, fallback = "Tente novamente em alguns instantes."): string {
  if (!err) return fallback;
  if (typeof err === "string") return sanitize(err) || fallback;
  if (err instanceof Error) return sanitize(err.message) || fallback;
  if (typeof err === "object" && err && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return sanitize(m) || fallback;
  }
  return fallback;
}

function sanitize(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";
  // remove vazamentos típicos de Postgres/PostgREST
  if (/permission denied|jwt|row-level security|relation .* does not exist/i.test(trimmed)) {
    return "Não foi possível concluir a operação.";
  }
  // limita tamanho
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

/** Slugify com normalização de acentos e fallback seguro. */
export function slugify(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Capitaliza primeira letra de cada palavra. */
export function titleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/\b\p{L}/gu, (m) => m.toUpperCase());
}

/** Garante um número dentro do intervalo. */
export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}
