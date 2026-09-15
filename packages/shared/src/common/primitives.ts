import { z } from 'zod';

export const IdSchema = z.coerce.number().int().positive();
export type Id = z.infer<typeof IdSchema>;

/** Crockford Base32 ULID (26 chars). Accepts any case; normalizes to uppercase. */
export const PublicIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/i, 'Invalid public id')
  .transform((value) => value.toUpperCase());
export type PublicId = z.infer<typeof PublicIdSchema>;

export const NameSchema = z.string().trim().min(1).max(200);
export const OptionalNameSchema = z.string().trim().min(1).max(200).optional();
