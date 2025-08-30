import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput, type Member } from '../schema';

export const createMember = async (input: CreateMemberInput): Promise<Member> => {
  try {
    // Insert member record
    const result = await db.insert(membersTable)
      .values({
        user_id: input.user_id,
        university_name: input.university_name,
        library_head_name: input.library_head_name,
        library_head_phone: input.library_head_phone,
        pic_name: input.pic_name,
        pic_phone: input.pic_phone,
        institution_address: input.institution_address,
        province: input.province,
        institution_email: input.institution_email,
        library_website_url: input.library_website_url,
        opac_url: input.opac_url,
        repository_status: input.repository_status,
        book_collection_count: input.book_collection_count,
        accreditation_status: input.accreditation_status
        // membership_status defaults to 'Pending' in schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Member creation failed:', error);
    throw error;
  }
};