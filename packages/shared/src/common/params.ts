import { z } from 'zod';
import { IdSchema, PublicIdSchema } from './primitives.js';

export const IdParamSchema = z.object({
  id: IdSchema,
});
export type IdParam = z.infer<typeof IdParamSchema>;

export const PublicIdParamSchema = z.object({
  publicId: PublicIdSchema,
});
export type PublicIdParam = z.infer<typeof PublicIdParamSchema>;
