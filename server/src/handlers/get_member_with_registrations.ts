import { db } from '../db';
import { membersTable, registrationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetMemberByUserIdInput, type MemberWithRegistrations } from '../schema';

export async function getMemberWithRegistrations(input: GetMemberByUserIdInput): Promise<MemberWithRegistrations | null> {
  try {
    // First, get the member by user_id
    const memberResult = await db.select()
      .from(membersTable)
      .where(eq(membersTable.user_id, input.user_id))
      .execute();

    if (memberResult.length === 0) {
      return null;
    }

    const member = memberResult[0];

    // Get all registrations for this member
    const registrationsResult = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.member_id, member.id))
      .execute();

    return {
      member,
      registrations: registrationsResult
    };
  } catch (error) {
    console.error('Failed to get member with registrations:', error);
    throw error;
  }
}