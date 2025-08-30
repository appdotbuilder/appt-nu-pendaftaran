import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema,
  loginInputSchema,
  createMemberInputSchema,
  createRegistrationInputSchema,
  updatePaymentStatusInputSchema,
  uploadDocumentInputSchema,
  getMemberByUserIdInputSchema,
  getRegistrationsByMemberIdInputSchema
} from './schema';
import { z } from 'zod';

// Import handlers
import { createUser } from './handlers/create_user';
import { login } from './handlers/login';
import { createMember } from './handlers/create_member';
import { getMemberByUserId } from './handlers/get_member_by_user_id';
import { getAllMembers } from './handlers/get_all_members';
import { createRegistration } from './handlers/create_registration';
import { getRegistrationsByMemberId } from './handlers/get_registrations_by_member_id';
import { getAllRegistrations } from './handlers/get_all_registrations';
import { updatePaymentStatus } from './handlers/update_payment_status';
import { uploadDocument } from './handlers/upload_document';
import { getMemberWithRegistrations } from './handlers/get_member_with_registrations';
import { updateMember, type UpdateMemberInput } from './handlers/update_member';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
    
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // Member management routes
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
    
  getMemberByUserId: publicProcedure
    .input(getMemberByUserIdInputSchema)
    .query(({ input }) => getMemberByUserId(input)),
    
  getAllMembers: publicProcedure
    .query(() => getAllMembers()),
    
  updateMember: publicProcedure
    .input(z.object({
      id: z.number(),
      university_name: z.string().optional(),
      library_head_name: z.string().optional(),
      library_head_phone: z.string().optional(),
      pic_name: z.string().optional(),
      pic_phone: z.string().optional(),
      institution_address: z.string().optional(),
      province: z.enum(['Jawa Timur', 'Jawa Barat', 'Jawa Tengah']).optional(),
      institution_email: z.string().email().optional(),
      library_website_url: z.string().url().nullable().optional(),
      opac_url: z.string().url().nullable().optional(),
      repository_status: z.enum(['Belum', 'Sudah']).optional(),
      book_collection_count: z.number().int().optional(),
      accreditation_status: z.enum(['Akreditasi A', 'Akreditasi B', 'Belum Akreditasi']).optional(),
      membership_status: z.enum(['Pending', 'Active', 'Inactive', 'Rejected']).optional()
    }))
    .mutation(({ input }) => updateMember(input)),

  // Registration management routes
  createRegistration: publicProcedure
    .input(createRegistrationInputSchema)
    .mutation(({ input }) => createRegistration(input)),
    
  getRegistrationsByMemberId: publicProcedure
    .input(getRegistrationsByMemberIdInputSchema)
    .query(({ input }) => getRegistrationsByMemberId(input)),
    
  getAllRegistrations: publicProcedure
    .query(() => getAllRegistrations()),

  // Admin routes for payment and document management
  updatePaymentStatus: publicProcedure
    .input(updatePaymentStatusInputSchema)
    .mutation(({ input }) => updatePaymentStatus(input)),
    
  uploadDocument: publicProcedure
    .input(uploadDocumentInputSchema)
    .mutation(({ input }) => uploadDocument(input)),

  // Dashboard route for complete member information
  getMemberWithRegistrations: publicProcedure
    .input(getMemberByUserIdInputSchema)
    .query(({ input }) => getMemberWithRegistrations(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`APPTNU TRPC server listening at port: ${port}`);
}

start();