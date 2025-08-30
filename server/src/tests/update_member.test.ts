import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable } from '../db/schema';
import { type UpdateMemberInput } from '../handlers/update_member';
import { updateMember } from '../handlers/update_member';
import { eq } from 'drizzle-orm';

describe('updateMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user and member
  const createTestUserAndMember = async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'Member'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test member
    const memberResult = await db.insert(membersTable)
      .values({
        user_id: user.id,
        university_name: 'Universitas Test',
        library_head_name: 'Dr. Test Kepala',
        library_head_phone: '08123456789',
        pic_name: 'Test PIC',
        pic_phone: '08987654321',
        institution_address: 'Jalan Test No. 123',
        province: 'Jawa Timur',
        institution_email: 'library@test.ac.id',
        library_website_url: 'https://library.test.ac.id',
        opac_url: 'https://opac.test.ac.id',
        repository_status: 'Sudah',
        book_collection_count: 50000,
        accreditation_status: 'Akreditasi A',
        membership_status: 'Pending'
      })
      .returning()
      .execute();

    return { user, member: memberResult[0] };
  };

  it('should update basic member information', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      university_name: 'Universitas Updated',
      library_head_name: 'Prof. Updated Kepala',
      pic_name: 'Updated PIC'
    };

    const result = await updateMember(updateInput);

    expect(result.id).toEqual(member.id);
    expect(result.university_name).toEqual('Universitas Updated');
    expect(result.library_head_name).toEqual('Prof. Updated Kepala');
    expect(result.pic_name).toEqual('Updated PIC');
    
    // Unchanged fields should remain the same
    expect(result.institution_email).toEqual(member.institution_email);
    expect(result.province).toEqual(member.province);
    expect(result.book_collection_count).toEqual(member.book_collection_count);
    
    // Updated timestamp should be newer
    expect(result.updated_at.getTime()).toBeGreaterThan(member.updated_at.getTime());
  });

  it('should update membership status', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      membership_status: 'Active'
    };

    const result = await updateMember(updateInput);

    expect(result.membership_status).toEqual('Active');
    expect(result.university_name).toEqual(member.university_name); // Other fields unchanged
  });

  it('should update contact information', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      library_head_phone: '08111111111',
      pic_phone: '08222222222',
      institution_email: 'newlibrary@test.ac.id'
    };

    const result = await updateMember(updateInput);

    expect(result.library_head_phone).toEqual('08111111111');
    expect(result.pic_phone).toEqual('08222222222');
    expect(result.institution_email).toEqual('newlibrary@test.ac.id');
  });

  it('should update URL fields including null values', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      library_website_url: null,
      opac_url: 'https://new-opac.test.ac.id'
    };

    const result = await updateMember(updateInput);

    expect(result.library_website_url).toBeNull();
    expect(result.opac_url).toEqual('https://new-opac.test.ac.id');
  });

  it('should update institutional details', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      institution_address: 'Jalan Baru No. 456',
      province: 'Jawa Barat',
      repository_status: 'Belum',
      book_collection_count: 75000,
      accreditation_status: 'Akreditasi B'
    };

    const result = await updateMember(updateInput);

    expect(result.institution_address).toEqual('Jalan Baru No. 456');
    expect(result.province).toEqual('Jawa Barat');
    expect(result.repository_status).toEqual('Belum');
    expect(result.book_collection_count).toEqual(75000);
    expect(result.accreditation_status).toEqual('Akreditasi B');
  });

  it('should update all fields at once', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      university_name: 'Universitas Complete Update',
      library_head_name: 'Dr. Complete Kepala',
      library_head_phone: '08333333333',
      pic_name: 'Complete PIC',
      pic_phone: '08444444444',
      institution_address: 'Jalan Complete No. 789',
      province: 'Jawa Tengah',
      institution_email: 'complete@test.ac.id',
      library_website_url: 'https://complete.test.ac.id',
      opac_url: 'https://opac-complete.test.ac.id',
      repository_status: 'Sudah',
      book_collection_count: 100000,
      accreditation_status: 'Akreditasi A',
      membership_status: 'Active'
    };

    const result = await updateMember(updateInput);

    expect(result.university_name).toEqual('Universitas Complete Update');
    expect(result.library_head_name).toEqual('Dr. Complete Kepala');
    expect(result.library_head_phone).toEqual('08333333333');
    expect(result.pic_name).toEqual('Complete PIC');
    expect(result.pic_phone).toEqual('08444444444');
    expect(result.institution_address).toEqual('Jalan Complete No. 789');
    expect(result.province).toEqual('Jawa Tengah');
    expect(result.institution_email).toEqual('complete@test.ac.id');
    expect(result.library_website_url).toEqual('https://complete.test.ac.id');
    expect(result.opac_url).toEqual('https://opac-complete.test.ac.id');
    expect(result.repository_status).toEqual('Sudah');
    expect(result.book_collection_count).toEqual(100000);
    expect(result.accreditation_status).toEqual('Akreditasi A');
    expect(result.membership_status).toEqual('Active');
  });

  it('should persist changes to database', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      university_name: 'Universitas Database Test',
      membership_status: 'Active'
    };

    await updateMember(updateInput);

    // Verify changes persisted by querying directly
    const updatedMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, member.id))
      .execute();

    expect(updatedMember).toHaveLength(1);
    expect(updatedMember[0].university_name).toEqual('Universitas Database Test');
    expect(updatedMember[0].membership_status).toEqual('Active');
    expect(updatedMember[0].updated_at.getTime()).toBeGreaterThan(member.updated_at.getTime());
  });

  it('should handle partial updates correctly', async () => {
    const { member } = await createTestUserAndMember();
    const originalEmail = member.institution_email;

    const updateInput: UpdateMemberInput = {
      id: member.id,
      university_name: 'Partial Update University'
      // Only updating university name, other fields should remain unchanged
    };

    const result = await updateMember(updateInput);

    expect(result.university_name).toEqual('Partial Update University');
    expect(result.institution_email).toEqual(originalEmail);
    expect(result.library_head_name).toEqual(member.library_head_name);
    expect(result.membership_status).toEqual(member.membership_status);
  });

  it('should throw error for non-existent member', async () => {
    const updateInput: UpdateMemberInput = {
      id: 99999, // Non-existent ID
      university_name: 'Should Fail'
    };

    await expect(updateMember(updateInput)).rejects.toThrow(/Member with id 99999 not found/i);
  });

  it('should handle zero book collection count', async () => {
    const { member } = await createTestUserAndMember();

    const updateInput: UpdateMemberInput = {
      id: member.id,
      book_collection_count: 0
    };

    const result = await updateMember(updateInput);

    expect(result.book_collection_count).toEqual(0);
  });
});