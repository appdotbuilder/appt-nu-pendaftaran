import { db } from '../db';
import { registrationsTable } from '../db/schema';
import { type UpdatePaymentStatusInput, type Registration } from '../schema';
import { eq } from 'drizzle-orm';

export async function updatePaymentStatus(input: UpdatePaymentStatusInput): Promise<Registration> {
  try {
    // First check if registration exists
    const existing = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, input.registration_id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Registration with ID ${input.registration_id} not found`);
    }

    // Update the registration with new payment status and optional admin notes
    const updateData: { 
      payment_status: 'Pending' | 'Confirmed' | 'Rejected'; 
      admin_notes?: string | null; 
      updated_at: Date 
    } = {
      payment_status: input.payment_status,
      updated_at: new Date()
    };

    // Only update admin_notes if it's provided in the input
    if (input.admin_notes !== undefined) {
      updateData.admin_notes = input.admin_notes;
    }

    const result = await db.update(registrationsTable)
      .set(updateData)
      .where(eq(registrationsTable.id, input.registration_id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Payment status update failed:', error);
    throw error;
  }
}