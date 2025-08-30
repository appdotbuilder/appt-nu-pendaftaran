import { db } from '../db';
import { registrationsTable } from '../db/schema';
import { type UploadDocumentInput, type Registration } from '../schema';
import { eq } from 'drizzle-orm';

export const uploadDocument = async (input: UploadDocumentInput): Promise<Registration> => {
  try {
    // First, verify the registration exists
    const existingRegistration = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, input.registration_id))
      .execute();

    if (existingRegistration.length === 0) {
      throw new Error(`Registration with id ${input.registration_id} not found`);
    }

    // Prepare update data based on document type
    const updateData = input.document_type === 'receipt'
      ? { receipt_url: input.document_url }
      : { certificate_url: input.document_url };

    // Update the registration record with the document URL
    const result = await db.update(registrationsTable)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(registrationsTable.id, input.registration_id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
};