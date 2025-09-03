import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// helpers to accept "a,b,c" OR ["a","b","c"] OR single "a"
const csvArr = <T extends z.ZodTypeAny>(el: T) =>
  z.union([z.string(), z.array(el)]).transform((v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  });

const toBool = z.union([z.boolean(), z.string()]).transform((v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['1', 'true', 'yes'].includes(v.toLowerCase());
  return false;
});

const toInt = (def: number) =>
  z.union([z.number().int(), z.string()]).transform((v) => {
    if (typeof v === 'number') return v;
    const n = parseInt(v as string, 10);
    return Number.isFinite(n) ? n : def;
  });

const EducationEnum = z.enum([
  'SD/Sederajat',
  'SMP/Sederajat',
  'SMA/MA/SMK/Sederajat',
  'Diploma Satu/D1',
  'Diploma Dua/D2',
  'Diploma Tiga/D3',
  'Sarjana/S1',
  'Magister/S2',
  'Doktor/S3',
]);

export const ListCandidatesSchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),

  // Gender checkboxes
  gender: csvArr(z.enum(['male', 'female'])).optional(),

  // Age slider (18..55 default)
  ageMin: toInt(18).optional(),
  ageMax: toInt(55).optional(),

  // Education (multi-select)
  education: csvArr(EducationEnum).optional(),

  // Marital status (checkboxes)
  maritalStatus: csvArr(z.enum(['Single', 'Married'])).optional(),

  // Domicile
  domicileCountry: z.enum(['All', 'Indonesia', 'Japan']).optional(),
  domicileCity: z.string().optional(),        // when Indonesia
  domicilePrefecture: z.string().optional(),  // when Japan

  // Experiences (multi-select) + "have certificate"
  experiences: csvArr(z.string()).optional(),       // array of industry/category tags from FE
  expHasCertificate: toBool.optional(),             // right-side checkbox

  // Certificates / Skills
  certNames: csvArr(z.string()).optional(),         // "General" free-text list
  jlpt: csvArr(z.enum(['N1', 'N2', 'N3', 'N4', 'N5'])).optional(),
  nat: csvArr(z.enum(['N1', 'N2', 'N3', 'N4', 'N5'])).optional(),
  jft: toBool.optional(),
  nurse: toBool.optional(),

  // Keep your old knobs around (ignored by service right now)
  page: toInt(1).optional(),
  perPage: toInt(20).optional(),
  all: toBool.optional(),
});

// Keep DTO for Nest (query parsing handled by Zod)
export class ListCandidatesDto extends createZodDto(ListCandidatesSchema) {}
export type ListCandidates = z.infer<typeof ListCandidatesSchema>;
