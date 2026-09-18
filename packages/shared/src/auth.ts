import { z } from 'zod';

export const RequestMagicLinkSchema = z.object({
  email: z.string().trim().email().max(320),
  locale: z.enum(['en', 'pl']).optional().default('en'),
});
export type RequestMagicLinkInput = z.infer<typeof RequestMagicLinkSchema>;

export const VerifyMagicLinkSchema = z.object({
  token: z.string().trim().min(1).max(200),
});
export type VerifyMagicLinkInput = z.infer<typeof VerifyMagicLinkSchema>;

export const PrincipalResponseSchema = z.object({
  id: z.coerce.number().int().positive(),
  kind: z.enum(['guest', 'registered']),
  email: z.string().email().nullable().optional(),
  displayName: z.string().nullable().optional(),
});
export type PrincipalResponse = z.infer<typeof PrincipalResponseSchema>;

export const SessionResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().datetime(),
  principal: PrincipalResponseSchema,
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
