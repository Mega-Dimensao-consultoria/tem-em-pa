// Máscaras de campo para formulários brasileiros.
// Cada função aceita o valor bruto (com ou sem máscara) e devolve o valor formatado.

export function onlyDigits(v: string): string {
  return (v ?? "").replace(/\D+/g, "");
}

/** 00000-000 */
export function maskCep(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** (00) 0000-0000 ou (00) 90000-0000 */
export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length < 3) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

/**
 * Exibe telefone de empresa sempre com DDD quando ele foi salvo separado.
 * Aceita telefone já formatado, com DDD embutido, ou apenas 8/9 dígitos.
 */
export function formatCompanyPhone(phone?: string | null, phoneDdd?: string | null): string {
  const phoneDigits = onlyDigits(phone ?? "");
  if (!phoneDigits) return "";
  if (phoneDigits.length >= 10) return maskPhone(phoneDigits);

  const ddd = onlyDigits(phoneDdd ?? "").slice(0, 2);
  if (ddd.length === 2 && (phoneDigits.length === 8 || phoneDigits.length === 9)) {
    return maskPhone(`${ddd}${phoneDigits}`);
  }

  if (phoneDigits.length === 8) return `${phoneDigits.slice(0, 4)}-${phoneDigits.slice(4)}`;
  if (phoneDigits.length === 9) return `${phoneDigits.slice(0, 5)}-${phoneDigits.slice(5)}`;
  return phone ?? "";
}


/** UF maiúscula, máx 2 letras */
export function maskUf(v: string): string {
  return (v ?? "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}
