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
  const translated = translateAuthMessage(trimmed);
  if (translated) return translated;
  // limita tamanho
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

/**
 * Traduz mensagens comuns da Supabase Auth (que vêm em inglês) para pt-BR.
 * Retorna string vazia quando a mensagem não for reconhecida.
 */
function translateAuthMessage(message: string): string {

  // Senha vazada (HaveIBeenPwned)
  if (/password is known to be weak|pwned|has been leaked|found in a data breach/i.test(message)) {
    return "Esta senha apareceu em vazamentos públicos de dados. Escolha uma senha diferente.";
  }
  // Senha muito curta — captura o número quando presente
  const shortMatch = message.match(/password should be at least (\d+) characters?/i);
  if (shortMatch) {
    return `A senha precisa ter pelo menos ${shortMatch[1]} caracteres.`;
  }
  // Requisitos de composição
  if (/password should contain at least one character of each/i.test(message)) {
    const needs: string[] = [];
    if (/abcdefghijklmnopqrstuvwxyz/i.test(message) && /ABCDEFGHIJKLMNOPQRSTUVWXYZ/.test(message)) {
      needs.push("letras maiúsculas e minúsculas");
    } else if (/abcdefghijklmnopqrstuvwxyz/i.test(message)) {
      needs.push("letras");
    }
    if (/0123456789/.test(message)) needs.push("números");
    if (/[!@#\$%\^&\*]/.test(message)) needs.push("símbolos");
    const list = needs.length ? needs.join(", ") : "letras, números e símbolos";
    return `A senha precisa conter ${list}.`;
  }
  // Fraca (regra genérica)
  if (/password is too weak|weak password/i.test(message)) {
    return "Senha muito fraca. Escolha uma senha mais forte.";
  }
  // E-mail já cadastrado
  if (/user already registered|already been registered|email address .* has already/i.test(message)) {
    return "Este e-mail já está cadastrado. Faça login ou recupere sua senha.";
  }
  // E-mail inválido
  if (/unable to validate email address|invalid email|email address .* is invalid/i.test(message)) {
    return "E-mail inválido. Verifique e tente novamente.";
  }
  // Credenciais inválidas (login)
  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return "E-mail ou senha incorretos.";
  }
  // E-mail não confirmado
  if (/email not confirmed|email address not confirmed/i.test(message)) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  // Rate limit — captura segundos se houver
  const rateMatch = message.match(/you can only request this after (\d+) seconds?/i);
  if (rateMatch) {
    return `Aguarde ${rateMatch[1]} segundos antes de tentar novamente.`;
  }
  if (/email rate limit exceeded|rate limit exceeded|too many requests/i.test(message)) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }
  // Sessão / token
  if (/invalid refresh token|refresh token not found|jwt expired/i.test(message)) {
    return "Sua sessão expirou. Entre novamente.";
  }
  // Novo password igual ao antigo
  if (/new password should be different|same as the old password/i.test(message)) {
    return "A nova senha precisa ser diferente da atual.";
  }
  // Signup desabilitado
  if (/signups? (are )?not allowed|signup is disabled/i.test(message)) {
    return "Novos cadastros estão temporariamente desativados.";
  }
  // Usuário não encontrado
  if (/user not found/i.test(message)) {
    return "Usuário não encontrado.";
  }
  // OAuth provider indisponível
  if (/unsupported provider|provider is not enabled/i.test(message)) {
    return "Este método de login não está disponível no momento.";
  }
  return "";
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

/**
 * Toast de erro padronizado (função pura, pode ser usada fora de componentes).
 * Sanitiza mensagens do Postgres/JWT/RLS para não vazar detalhes técnicos.
 */
export function toastError(error: unknown, prefix?: string): void {
  const message = extractErrorMessage(error);
  toast.error(prefix ? `${prefix}: ${message}` : message);
}
