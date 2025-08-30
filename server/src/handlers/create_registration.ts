import { db } from '../db';
import { registrationsTable, membersTable } from '../db/schema';
import { type CreateRegistrationInput, type Registration } from '../schema';
import { eq } from 'drizzle-orm';

export const createRegistration = async (input: CreateRegistrationInput): Promise<Registration> => {
  try {
    // Verify that the member exists before creating registration
    const existingMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .execute();

    if (existingMember.length === 0) {
      throw new Error(`Member with id ${input.member_id} does not exist`);
    }

    // Insert registration record
    const result = await db.insert(registrationsTable)
      .values({
        member_id: input.member_id,
        registration_type: input.registration_type,
        payment_proof_url: input.payment_proof_url,
        payment_status: 'Pending', // Default status
        admin_notes: null,
        receipt_url: null,
        certificate_url: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Registration creation failed:', error);
    throw error;
  }
};