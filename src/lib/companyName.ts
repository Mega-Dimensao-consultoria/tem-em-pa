/**
 * Normalização de nomes de empresas para detecção de duplicatas.
 *
 * Registros públicos importados (prefeituras, escolas, UBS…) compartilham
 * prefixos institucionais genéricos que se repetem em milhares de cidades
 * diferentes. Comparar nomes sem remover esses prefixos gera falsos
 * positivos em massa.
 */

export function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const GENERIC_NAME_PREFIXES = [
  "prefeitura municipal de",
  "prefeitura municipal",
  "prefeitura de",
  "prefeitura",
  "camara municipal de",
  "camara municipal",
  "escola municipal de ensino fundamental",
  "escola municipal de educacao infantil",
  "escola estadual de ensino fundamental",
  "escola estadual de ensino medio",
  "escola municipal de",
  "escola estadual de",
  "escola municipal",
  "escola estadual",
  "escola de educacao infantil",
  "escola de educacao basica",
  "escola de ensino fundamental",
  "escola de ensino medio",
  "centro municipal de educacao infantil",
  "centro de educacao infantil",
  "centro municipal de",
  "centro de educacao",
  "colegio estadual de",
  "colegio municipal de",
  "colegio estadual",
  "colegio municipal",
  "creche municipal",
  "unidade basica de saude",
  "e m e i f",
  "e m e i",
  "e m e f",
  "e e e f m",
  "e e e f",
  "e e e m",
  "e m",
  "e e",
  "emeif",
  "emeb",
  "emef",
  "emei",
  "eeef",
  "eeem",
  "esc est ens fund",
  "esc est ens medio",
  "esc mun ens fund",
  "esc est",
  "esc mun",
  "cr p conv",
  "cei",
  "cmei",
  "ubs",
];

/**
 * Nome normalizado sem o prefixo institucional genérico — o "núcleo"
 * que realmente identifica a empresa. Retorna "" quando o nome é
 * apenas o prefixo genérico.
 */
export function coreCompanyName(name: string | null | undefined): string {
  const n = normalizeName(name);
  let best = n;
  for (const p of GENERIC_NAME_PREFIXES) {
    if (n === p) return "";
    if (n.startsWith(p + " ")) {
      const rest = n.slice(p.length + 1).trim();
      if (rest.length < best.length) best = rest;
    }
  }
  return best;
}
