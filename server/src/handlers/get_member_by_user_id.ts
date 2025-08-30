import { db } from '../db';
import { membersTable } from '../db/schema';
import { type GetMemberByUserIdInput, type Member } from '../schema';
import { eq } from 'drizzle-orm';

export async function getMemberByUserId(input: GetMemberByUserIdInput): Promise<Member | null> {
  try {
    // Query member by user_id
    const results = await db.select()
      .from(membersTable)
      .where(eq(membersTable.user_id, input.user_id))
      .execute();

    // Return null if no member found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) member record
    const member = results[0];
    return {
      ...member,
      // Convert numeric fields - book_collection_count is integer, no conversion needed
      // All other fields are already in correct types from the database
    };
  } catch (error) {
    console.error('Failed to get member by user ID:', error);
    throw error;
  }
}