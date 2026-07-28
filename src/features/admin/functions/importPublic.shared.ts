import { z } from "zod";

export const rowInputSchema = z.object({
  external_id: z.string().min(1).max(200),
  name: z.string().min(2).max(240),
  city_name: z.string().min(2).max(160),
  state: z.string().length(2),
  address: z.string().max(400).nullable().optional(),
  phone: z.string().max(60).nullable().optional(),
  phone_ddd: z.string().max(4).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  neighborhood: z.string().max(120).nullable().optional(),
  category_slug: z.string().max(120).nullable().optional(),
  cep: z.string().max(12).nullable().optional(),
  number: z.string().max(40).nullable().optional(),
  complement: z.string().max(200).nullable().optional(),
  whatsapp: z.string().max(60).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  website: z.string().max(400).nullable().optional(),
  instagram_url: z.string().max(400).nullable().optional(),
  facebook_url: z.string().max(400).nullable().optional(),
});

export type RowInput = z.infer<typeof rowInputSchema>;

export const batchSchema = z.object({
  source: z.enum(["inep_escolas", "cnes_saude", "empresas"]),
  rows: z.array(rowInputSchema).min(1).max(500),
});

export type ImportBatchInput = z.infer<typeof batchSchema>;

export type ImportRowLog = {
  level: "ok" | "duplicate" | "no_city" | "error";
  external_id: string;
  name: string;
  city_name: string;
  state: string;
  reason?: string;
};

export type ImportBatchResult = {
  inserted: number;
  skipped_no_city: number;
  skipped_duplicate: number;
  errors: number;
  logs: ImportRowLog[];
};

export const IMPORT_BATCH_SIZE = 300;

export function parseImportBatchInput(input: unknown): ImportBatchInput {
  return batchSchema.parse(input);
}