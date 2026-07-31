import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient } from "./_client";
import { coreCompanyName, normalizeName } from "@/lib/companyName";

const normalize = normalizeName;

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

type RawDupRow = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  cities: { name: string | null } | null;
  neighborhoods: { name: string | null } | null;
};

export const checkCompanyDuplicate = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(20).optional().or(z.literal("")),
        whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
        cityId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const nameNorm = normalize(data.name);
    const firstWord = nameNorm.split(" ")[0];
    if (firstWord.length < 3) return [] as DuplicateMatch[];

    let q = sb
      .from("companies")
      .select(
        "id, name, phone, whatsapp, status, cities:city_id(name), neighborhoods:neighborhood_id(name)",
      )
      .in("status", ["approved", "pending", "claimed_pending"])
      .ilike("name", `%${firstWord}%`)
      .limit(50);
    if (data.cityId) q = q.eq("city_id", data.cityId);
    const { data: rowsRaw, error } = await q;
    if (error) return [] as DuplicateMatch[];
    const rows = (rowsRaw ?? []) as unknown as RawDupRow[];

    const phoneDigits = data.phone ? digits(data.phone) : "";
    const wppDigits = data.whatsapp ? digits(data.whatsapp) : "";

    const matches: DuplicateMatch[] = [];
    for (const r of rows) {
      const rn = normalize(r.name ?? "");
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
          neighborhood: r.neighborhoods?.name ?? null,
          city: r.cities?.name ?? null,
          phone: r.phone,
          whatsapp: r.whatsapp,
          reason: nameMatch ? "name" : "phone",
        });
      }
      if (matches.length >= 5) break;
    }
    return matches;
  });
