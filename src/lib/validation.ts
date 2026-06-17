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
  imageUrl: z
    .string()
    .refine(
      (v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"),
      "Informe um URL https://... ou caminho local (ex.: /uploads/...).",
    )
    .optional()
    .or(z.literal("")),
  heroAlt: z.string().max(200).optional().or(z.literal("")),
  authorName: z.string().max(120).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  featured: z.union([z.literal("on"), z.literal("off"), z.boolean()]).optional(),
  tags: z.string().max(500).optional().or(z.literal("")), // CSV
});

export type PostInput = z.infer<typeof postSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(slugRegex, "Use apenas letras minúsculas, números e hífens."),
  description: z.string().max(500).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/, "Cor em hex (ex.: #c8102e).")
    .optional()
    .or(z.literal("")),
  order: z.coerce.number().int().min(0).max(999).optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const themeSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/, "Cor em hex (ex.: #c8102e).")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .refine(
      (v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"),
      "Informe um URL https://... ou caminho local (ex.: /uploads/...).",
    )
    .optional()
    .or(z.literal("")),
  tagline: z.string().max(160).optional().or(z.literal("")),
  language: z.string().min(2).max(10).optional().or(z.literal("")),
});
export type ThemeInput = z.infer<typeof themeSchema>;

/** Normaliza cor hex: aceita "c8102e" ou "#c8102e", devolve "#c8102e". null se vazio/inválido. */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  return `#${v.toLowerCase()}`;
}

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
