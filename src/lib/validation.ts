// Schemas de validação (zod) compartilhados entre server actions e formulários.
import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const siteSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(120),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(slugRegex, "Use apenas letras minúsculas, números e hífens."),
  domain: z
    .string()
    .max(253)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Domínio inválido.")
    .optional()
    .or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "LIVE", "PAUSED"]),
});

export type SiteInput = z.infer<typeof siteSchema>;

export const postSchema = z.object({
  title: z.string().min(2, "Título muito curto.").max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(slugRegex, "Use apenas letras minúsculas, números e hífens."),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(1, "Conteúdo não pode ser vazio."),
  imageUrl: z.string().url("URL inválida.").optional().or(z.literal("")),
});

export type PostInput = z.infer<typeof postSchema>;

export const sourceSchema = z.object({
  type: z.enum(["GOOGLE_TRENDS", "RSS", "WEBSITE"]),
  url: z.string().url("Informe uma URL válida (feed RSS / Google Trends RSS / site)."),
  label: z.string().max(120).optional().or(z.literal("")),
  // siteId vazio = fonte global (admin).
  siteId: z.string().optional().or(z.literal("")),
});

export type SourceInput = z.infer<typeof sourceSchema>;

/** Gera um slug a partir de um texto livre. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}
