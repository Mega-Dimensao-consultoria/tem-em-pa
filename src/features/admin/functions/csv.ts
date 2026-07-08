/** Minimal RFC-4180 CSV parser: handles quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === "," || c === ";") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // handle CRLF
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

export type CsvHeader =
  | "name"
  | "description"
  | "category"
  | "cep"
  | "address"
  | "number"
  | "complement"
  | "neighborhood"
  | "city"
  | "state"
  | "phone"
  | "whatsapp"
  | "email"
  | "website"
  | "instagram_url"
  | "facebook_url";

const ALIASES: Record<string, CsvHeader> = {
  nome: "name",
  name: "name",
  empresa: "name",
  descricao: "description",
  descrição: "description",
  description: "description",
  categoria: "category",
  category: "category",
  slug_categoria: "category",
  cep: "cep",
  endereco: "address",
  endereço: "address",
  address: "address",
  logradouro: "address",
  numero: "number",
  número: "number",
  number: "number",
  complemento: "complement",
  complement: "complement",
  bairro: "neighborhood",
  neighborhood: "neighborhood",
  cidade: "city",
  city: "city",
  estado: "state",
  uf: "state",
  state: "state",
  telefone: "phone",
  fone: "phone",
  phone: "phone",
  whatsapp: "whatsapp",
  zap: "whatsapp",
  email: "email",
  "e-mail": "email",
  site: "website",
  website: "website",
  url: "website",
  instagram: "instagram_url",
  instagram_url: "instagram_url",
  facebook: "facebook_url",
  facebook_url: "facebook_url",
};

export function mapHeaders(headerRow: string[]): (CsvHeader | null)[] {
  return headerRow.map((h) => {
    const k = h
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return ALIASES[k] ?? null;
  });
}
