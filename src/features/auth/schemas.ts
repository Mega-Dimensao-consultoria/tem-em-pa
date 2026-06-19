import { z } from "zod";

export const emailSchema = z.string().trim().email("E-mail inválido").max(255);
export const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(72);
