import { z } from 'zod';

// Enum schemas
export const provinceSchema = z.enum(['Jawa Timur', 'Jawa Barat', 'Jawa Tengah']);
export const repositoryStatusSchema = z.enum(['Belum', 'Sudah']);
export const accreditationStatusSchema = z.enum(['Akreditasi A', 'Akreditasi B', 'Belum Akreditasi']);
export const registrationTypeSchema = z.enum(['Pendaftaran Baru', 'Perpanjangan']);
export const membershipStatusSchema = z.enum(['Pending', 'Active', 'Inactive', 'Rejected']);
export const paymentStatusSchema = z.enum(['Pending', 'Confirmed', 'Rejected']);
export const userRoleSchema = z.enum(['Admin', 'Member']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Member schema
export const memberSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  university_name: z.string(),
  library_head_name: z.string(),
  library_head_phone: z.string(),
  pic_name: z.string(),
  pic_phone: z.string(),
  institution_address: z.string(),
  province: provinceSchema,
  institution_email: z.string().email(),
  library_website_url: z.string().url().nullable(),
  opac_url: z.string().url().nullable(),
  repository_status: repositoryStatusSchema,
  book_collection_count: z.number().int(),
  accreditation_status: accreditationStatusSchema,
  membership_status: membershipStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Member = z.infer<typeof memberSchema>;

// Registration schema
export const registrationSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  registration_type: registrationTypeSchema,
  payment_proof_url: z.string().nullable(),
  payment_status: paymentStatusSchema,
  admin_notes: z.string().nullable(),
  receipt_url: z.string().nullable(),
  certificate_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Registration = z.infer<typeof registrationSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: userRoleSchema.default('Member')
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const createMemberInputSchema = z.object({
  user_id: z.number(),
  university_name: z.string().min(1, 'Nama perguruan tinggi harus diisi'),
  library_head_name: z.string().min(1, 'Nama kepala perpustakaan harus diisi'),
  library_head_phone: z.string().min(1, 'No. HP kepala perpustakaan harus diisi'),
  pic_name: z.string().min(1, 'Nama PIC harus diisi'),
  pic_phone: z.string().min(1, 'No. HP PIC harus diisi'),
  institution_address: z.string().min(1, 'Alamat institusi harus diisi'),
  province: provinceSchema,
  institution_email: z.string().email('Email institusi harus valid'),
  library_website_url: z.string().url('URL website perpustakaan harus valid').nullable(),
  opac_url: z.string().url('URL OPAC harus valid').nullable(),
  repository_status: repositoryStatusSchema,
  book_collection_count: z.number().int().positive('Jumlah koleksi buku harus positif'),
  accreditation_status: accreditationStatusSchema
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export const createRegistrationInputSchema = z.object({
  member_id: z.number(),
  registration_type: registrationTypeSchema,
  payment_proof_url: z.string().nullable()
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationInputSchema>;

export const updatePaymentStatusInputSchema = z.object({
  registration_id: z.number(),
  payment_status: paymentStatusSchema,
  admin_notes: z.string().nullable().optional()
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusInputSchema>;

export const uploadDocumentInputSchema = z.object({
  registration_id: z.number(),
  document_type: z.enum(['receipt', 'certificate']),
  document_url: z.string().url()
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

export const getMemberByUserIdInputSchema = z.object({
  user_id: z.number()
});

export type GetMemberByUserIdInput = z.infer<typeof getMemberByUserIdInputSchema>;

export const getRegistrationsByMemberIdInputSchema = z.object({
  member_id: z.number()
});

export type GetRegistrationsByMemberIdInput = z.infer<typeof getRegistrationsByMemberIdInputSchema>;

// Response schemas
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string().optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const memberWithRegistrationsSchema = z.object({
  member: memberSchema,
  registrations: z.array(registrationSchema)
});

export type MemberWithRegistrations = z.infer<typeof memberWithRegistrationsSchema>;