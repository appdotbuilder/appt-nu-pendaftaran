import { db } from '../db';
import { registrationsTable } from '../db/schema';
import { type GetRegistrationsByMemberIdInput, type Registration } from '../schema';
import { eq } from 'drizzle-orm';

export async function getRegistrationsByMemberId(input: GetRegistrationsByMemberIdInput): Promise<Registration[]> {
  try {
    // Query all registrations for the specified member ID
    const results = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.member_id, input.member_id))
      .execute();

    // Return the results directly since no numeric conversions are needed
    // All fields in registrations table are already in the correct format
    return results;
  } catch (error) {
    console.error('Failed to fetch registrations by member ID:', error);
    throw error;
  }
}