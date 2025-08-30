import { db } from '../db';
import { registrationsTable } from '../db/schema';
import { type Registration } from '../schema';

export const getAllRegistrations = async (): Promise<Registration[]> => {
  try {
    const results = await db.select()
      .from(registrationsTable)
      .execute();

    return results.map(registration => ({
      ...registration,
      created_at: registration.created_at,
      updated_at: registration.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch all registrations:', error);
    throw error;
  }
};