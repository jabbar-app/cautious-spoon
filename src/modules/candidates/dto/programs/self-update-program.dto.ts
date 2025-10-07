
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ProgramDocumentItem = z.object({
  id: z.string().optional().default(''),
  url: z.string().min(1),
  label: z.string().optional().default(''),
});

const PaymentSchemaForSelf = z.object({
  dp: z.number().int().nonnegative().optional(),
  type: z.number().int().optional(),
  terms: z.number().int().nonnegative().optional(),
  payment_documents: z.array(z.string()).nullable().optional(),
  // still no is_paid
});

export const SelfUpdateProgramSchema = z
  .object({
    is_agree: z.boolean().optional(),
    documents: z.array(ProgramDocumentItem).optional(),
    payment: PaymentSchemaForSelf.optional(),
    notes: z.string().max(10_000).optional(),
    stage: z.string().max(100).optional(),
    tags: z.array(z.string()).optional(),
    // metadata: z.record(z.any()).optional(),
    // no status / flags / schedule from candidate
  })
  .strict();

export class SelfUpdateProgramDto extends createZodDto(SelfUpdateProgramSchema) {}
