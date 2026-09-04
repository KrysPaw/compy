import { z } from 'zod';

export const IdSchema = z.coerce.number().int().positive();
export type Id = z.infer<typeof IdSchema>;

export const NameSchema = z.string().trim().min(1).max(200);
export const OptionalNameSchema = z.string().trim().min(1).max(200).optional();
