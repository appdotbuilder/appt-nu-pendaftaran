import { db } from '../db';
import { membersTable } from '../db/schema';
import { type Member } from '../schema';
import { eq } from 'drizzle-orm';

export interface UpdateMemberInput {
    id: number;
    university_name?: string;
    library_head_name?: string;
    library_head_phone?: string;
    pic_name?: string;
    pic_phone?: string;
    institution_address?: string;
    province?: 'Jawa Timur' | 'Jawa Barat' | 'Jawa Tengah';
    institution_email?: string;
    library_website_url?: string | null;
    opac_url?: string | null;
    repository_status?: 'Belum' | 'Sudah';
    book_collection_count?: number;
    accreditation_status?: 'Akreditasi A' | 'Akreditasi B' | 'Belum Akreditasi';
    membership_status?: 'Pending' | 'Active' | 'Inactive' | 'Rejected';
}

export const updateMember = async (input: UpdateMemberInput): Promise<Member> => {
    try {
        // Check if member exists
        const existingMember = await db.select()
            .from(membersTable)
            .where(eq(membersTable.id, input.id))
            .execute();

        if (existingMember.length === 0) {
            throw new Error(`Member with id ${input.id} not found`);
        }

        // Build update object with only provided fields
        const updateData: Partial<typeof membersTable.$inferInsert> = {};
        
        if (input.university_name !== undefined) updateData.university_name = input.university_name;
        if (input.library_head_name !== undefined) updateData.library_head_name = input.library_head_name;
        if (input.library_head_phone !== undefined) updateData.library_head_phone = input.library_head_phone;
        if (input.pic_name !== undefined) updateData.pic_name = input.pic_name;
        if (input.pic_phone !== undefined) updateData.pic_phone = input.pic_phone;
        if (input.institution_address !== undefined) updateData.institution_address = input.institution_address;
        if (input.province !== undefined) updateData.province = input.province;
        if (input.institution_email !== undefined) updateData.institution_email = input.institution_email;
        if (input.library_website_url !== undefined) updateData.library_website_url = input.library_website_url;
        if (input.opac_url !== undefined) updateData.opac_url = input.opac_url;
        if (input.repository_status !== undefined) updateData.repository_status = input.repository_status;
        if (input.book_collection_count !== undefined) updateData.book_collection_count = input.book_collection_count;
        if (input.accreditation_status !== undefined) updateData.accreditation_status = input.accreditation_status;
        if (input.membership_status !== undefined) updateData.membership_status = input.membership_status;

        // Always update the updated_at timestamp
        updateData.updated_at = new Date();

        // Perform the update
        const result = await db.update(membersTable)
            .set(updateData)
            .where(eq(membersTable.id, input.id))
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Member update failed:', error);
        throw error;
    }
};