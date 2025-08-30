import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  pgEnum,
  varchar 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const provinceEnum = pgEnum('province', ['Jawa Timur', 'Jawa Barat', 'Jawa Tengah']);
export const repositoryStatusEnum = pgEnum('repository_status', ['Belum', 'Sudah']);
export const accreditationStatusEnum = pgEnum('accreditation_status', ['Akreditasi A', 'Akreditasi B', 'Belum Akreditasi']);
export const registrationTypeEnum = pgEnum('registration_type', ['Pendaftaran Baru', 'Perpanjangan']);
export const membershipStatusEnum = pgEnum('membership_status', ['Pending', 'Active', 'Inactive', 'Rejected']);
export const paymentStatusEnum = pgEnum('payment_status', ['Pending', 'Confirmed', 'Rejected']);
export const userRoleEnum = pgEnum('user_role', ['Admin', 'Member']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('Member'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Members table
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  university_name: text('university_name').notNull(),
  library_head_name: text('library_head_name').notNull(),
  library_head_phone: varchar('library_head_phone', { length: 20 }).notNull(),
  pic_name: text('pic_name').notNull(),
  pic_phone: varchar('pic_phone', { length: 20 }).notNull(),
  institution_address: text('institution_address').notNull(),
  province: provinceEnum('province').notNull(),
  institution_email: varchar('institution_email', { length: 255 }).notNull(),
  library_website_url: text('library_website_url'),
  opac_url: text('opac_url'),
  repository_status: repositoryStatusEnum('repository_status').notNull(),
  book_collection_count: integer('book_collection_count').notNull(),
  accreditation_status: accreditationStatusEnum('accreditation_status').notNull(),
  membership_status: membershipStatusEnum('membership_status').notNull().default('Pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Registrations table
export const registrationsTable = pgTable('registrations', {
  id: serial('id').primaryKey(),
  member_id: integer('member_id').notNull().references(() => membersTable.id, { onDelete: 'cascade' }),
  registration_type: registrationTypeEnum('registration_type').notNull(),
  payment_proof_url: text('payment_proof_url'),
  payment_status: paymentStatusEnum('payment_status').notNull().default('Pending'),
  admin_notes: text('admin_notes'),
  receipt_url: text('receipt_url'),
  certificate_url: text('certificate_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relationships
export const usersRelations = relations(usersTable, ({ one }) => ({
  member: one(membersTable, {
    fields: [usersTable.id],
    references: [membersTable.user_id]
  })
}));

export const membersRelations = relations(membersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [membersTable.user_id],
    references: [usersTable.id]
  }),
  registrations: many(registrationsTable)
}));

export const registrationsRelations = relations(registrationsTable, ({ one }) => ({
  member: one(membersTable, {
    fields: [registrationsTable.member_id],
    references: [membersTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Registration = typeof registrationsTable.$inferSelect;
export type NewRegistration = typeof registrationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  members: membersTable, 
  registrations: registrationsTable 
};