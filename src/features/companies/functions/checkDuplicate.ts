import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient } from "./_client";

/** Strip diacritics, lowercase, keep alphanumerics and spaces. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keep digits only. */
function digits(s: string): string {
  return s.replace(/\D+/g, "");
}

export type DuplicateMatch = {
  id: string;
  name: string;
  neighborhood: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  reason: "name" | "phone";
};

/**
 * Best-effort duplicate check for company registration.
 * Returns up to 5 approved/pending candidates that match by normalized name
 * or by identical phone/whatsapp digits. Case-insensitive; ignores accents.
 */
export const checkCompanyDuplicate = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(20).optional().or(z.literal("")),
        whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const nameNorm = normalize(data.name);
    const firstWord = nameNorm.split(" ")[0];
    if (firstWord.length < 3) return [] as DuplicateMatch[];

    const { data: rows, error } = await sb
      .from("companies")
      .select("id, name, neighborhood, city, phone, whatsapp, status")
      .in("status", ["approved", "pending", "claimed_pending"])
      .ilike("name", `%${firstWord}%`)
      .limit(50);
    if (error) return [] as DuplicateMatch[];

    const phoneDigits = data.phone ? digits(data.phone) : "";
    const wppDigits = data.whatsapp ? digits(data.whatsapp) : "";

    const matches: DuplicateMatch[] = [];
    for (const r of rows ?? []) {
      const rn = normalize(r.name ?? "");
      // Name match: exact normalized OR both share their first two words
      const nameMatch =
        rn === nameNorm ||
        rn.startsWith(nameNorm) ||
        nameNorm.startsWith(rn) ||
        rn.split(" ").slice(0, 2).join(" ") === nameNorm.split(" ").slice(0, 2).join(" ");
      const rPhone = r.phone ? digits(r.phone) : "";
      const rWpp = r.whatsapp ? digits(r.whatsapp) : "";
      const phoneMatch =
        (phoneDigits.length >= 8 && (rPhone === phoneDigits || rWpp === phoneDigits)) ||
        (wppDigits.length >= 8 && (rPhone === wppDigits || rWpp === wppDigits));
      if (nameMatch || phoneMatch) {
        matches.push({
          id: r.id,
          name: r.name,
          neighborhood: r.neighborhood,
          city: r.city,
          phone: r.phone,
          whatsapp: r.whatsapp,
          reason: nameMatch ? "name" : "phone",
        });
      }
      if (matches.length >= 5) break;
    }
    return matches;
  });
