import { z } from "zod";

/**
 * Validation for the admin clients editor. A client is a logo shown in the
 * "they trust us" strip: a name, a logo image URL, an optional website link,
 * a display order and a published flag. No bilingual fields.
 *
 * The client form collects string values and maps them to this shape before
 * submitting; the server action re-validates with the same schema as a security
 * boundary.
 */

const url = z.string().trim().url().max(500);

export const clientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  logoUrl: url,
  /** Optional — an empty string means "no website". */
  website: z.union([url, z.literal("")]),
  order: z.coerce.number().int().min(0).max(9999),
  published: z.boolean(),
});

export type ClientInput = z.infer<typeof clientSchema>;
