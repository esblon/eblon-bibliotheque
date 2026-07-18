import { z } from "zod"

export const schemaPagination = z.object({
  page: z.coerce.number().int().min(1).default(1), limite: z.coerce.number().int().min(1).max(100).default(20),
  recherche: z.string().trim().max(200).optional(), tri: z.string().regex(/^[a-z_]+$/).optional(), ordre: z.enum(["asc", "desc"]).default("asc"),
})
export type Pagination = z.infer<typeof schemaPagination>
export function lirePagination(url: URL): Pagination { return schemaPagination.parse(Object.fromEntries(url.searchParams)) }
export function metaPagination(page: number, limite: number, total: number) { return { page, limite, total, nombre_pages: Math.ceil(total / limite) } }
