// src/modules/candidate-programs/dto/update-candidate-program.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const StatusEnum = z.enum([
  'register',
  'waiting_first_phase',
  'upload_document',
  'attended',
  'passed_test',
  'failed_test',
  'shortlisted',
  'hired',
  'rejected',
]);

const ProgramDocumentItem = z.object({
  id: z.string().optional().default(''),
  url: z.string().min(1),
  label: z.string().optional().default(''),
});

const PaymentSchema = z.object({
  dp: z.number().int().nonnegative().optional().default(0),
  type: z.number().int().optional().default(1),   // 1=cash, 2=installments? adjust as needed
  terms: z.number().int().nonnegative().optional().default(0),
  is_paid: z.boolean().optional(),                // admin can set
  payment_documents: z.array(z.string()).nullable().optional(),
});

export const UpdateCandidateProgramSchema = z
  .object({
    status: StatusEnum.optional(),
    is_mcu: z.boolean().optional(),
    is_agree: z.boolean().optional(),

    documents: z.array(ProgramDocumentItem).optional(),
    payment: PaymentSchema.optional(),

    is_passed_test: z.boolean().nullable().optional(),
    is_matches_requirement: z.boolean().nullable().optional(),
    reject_reason_matches: z.string().max(10_000).nullable().optional(),
    reject_reason_not_passed: z.string().max(10_000).nullable().optional(),

    notes: z.string().max(10_000).optional(),
    stage: z.string().max(100).optional(),
    tags: z.array(z.string()).optional(),
    // metadata: z.record(z.any()).optional(),

    // Accept either stored string "start/end/mode/link" or structured object
    test_schedule: z
      .union([
        z.string(),
        z.object({
          start: z.string().min(1),
          end: z.string().min(1),
          mode: z.string().min(1),
          link: z.string().optional().nullable(),
        }),
      ])
      .nullable()
      .optional(),
  })
  .strict();

export class UpdateCandidateProgramDto extends createZodDto(UpdateCandidateProgramSchema) {}
