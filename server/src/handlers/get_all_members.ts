import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';

export async function getAllMembers(): Promise<Member[]> {
  try {
    const results = await db.select()
      .from(membersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get all members:', error);
    throw error;
  }
}