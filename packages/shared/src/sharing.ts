import { z } from 'zod';
import { IdSchema } from './common/primitives.js';

export const InviteByEmailSchema = z.object({
  email: z.string().trim().email().max(320),
});
export type InviteByEmailInput = z.infer<typeof InviteByEmailSchema>;

export const CreateAccessRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  message: z.string().trim().max(1000).optional(),
});
export type CreateAccessRequestInput = z.infer<typeof CreateAccessRequestSchema>;

export const ComparisonAccessStatusSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('accessible'),
    role: z.enum(['owner', 'editor']),
  }),
  z.object({
    status: z.literal('locked'),
  }),
]);
export type ComparisonAccessStatus = z.infer<typeof ComparisonAccessStatusSchema>;

export const ComparisonGrantResponseSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  role: z.literal('editor'),
  createdAt: z.coerce.date(),
});
export type ComparisonGrantResponse = z.infer<typeof ComparisonGrantResponseSchema>;

export const AccessRequestResponseSchema = z.object({
  id: IdSchema,
  requesterId: IdSchema,
  displayName: z.string(),
  message: z.string().nullable(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type AccessRequestResponse = z.infer<typeof AccessRequestResponseSchema>;
