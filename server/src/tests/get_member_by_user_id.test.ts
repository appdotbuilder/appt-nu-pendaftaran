import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable } from '../db/schema';
import { type GetMemberByUserIdInput, type CreateUserInput, type CreateMemberInput } from '../schema';
import { getMemberByUserId } from '../handlers/get_member_by_user_id';

describe('getMemberByUserId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async (email: string = 'test@example.com'): Promise<number> => {
    const userResult = await db.insert(usersTable)
      .values({
        email,
        password_hash: 'hashed_password',
        role: 'Member'
      })
      .returning()
      .execute();
    return userResult[0].id;
  };

  // Helper function to create a test member
  const createTestMember = async (userId: number): Promise<void> => {
    await db.insert(membersTable)
      .values({
        user_id: userId,
        university_name: 'Test University',
        library_head_name: 'John Doe',
        library_head_phone: '+6281234567890',
        pic_name: 'Jane Smith',
        pic_phone: '+6281234567891',
        institution_address: 'Jl. Test No. 123, Jakarta',
        province: 'Jawa Timur',
        institution_email: 'library@test.edu',
        library_website_url: 'https://library.test.edu',
        opac_url: 'https://opac.test.edu',
        repository_status: 'Sudah',
        book_collection_count: 10000,
        accreditation_status: 'Akreditasi A',
        membership_status: 'Active'
      })
      .execute();
  };

  it('should return member when user_id exists', async () => {
    // Create test user and member
    const userId = await createTestUser();
    await createTestMember(userId);

    const input: GetMemberByUserIdInput = { user_id: userId };
    const result = await getMemberByUserId(input);

    // Verify member is returned with correct data
    expect(result).toBeDefined();
    expect(result?.user_id).toEqual(userId);
    expect(result?.university_name).toEqual('Test University');
    expect(result?.library_head_name).toEqual('John Doe');
    expect(result?.library_head_phone).toEqual('+6281234567890');
    expect(result?.pic_name).toEqual('Jane Smith');
    expect(result?.pic_phone).toEqual('+6281234567891');
    expect(result?.institution_address).toEqual('Jl. Test No. 123, Jakarta');
    expect(result?.province).toEqual('Jawa Timur');
    expect(result?.institution_email).toEqual('library@test.edu');
    expect(result?.library_website_url).toEqual('https://library.test.edu');
    expect(result?.opac_url).toEqual('https://opac.test.edu');
    expect(result?.repository_status).toEqual('Sudah');
    expect(result?.book_collection_count).toEqual(10000);
    expect(typeof result?.book_collection_count).toBe('number');
    expect(result?.accreditation_status).toEqual('Akreditasi A');
    expect(result?.membership_status).toEqual('Active');
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user_id does not exist', async () => {
    const input: GetMemberByUserIdInput = { user_id: 99999 };
    const result = await getMemberByUserId(input);

    expect(result).toBeNull();
  });

  it('should return null when user exists but has no member profile', async () => {
    // Create user but no member profile
    const userId = await createTestUser();

    const input: GetMemberByUserIdInput = { user_id: userId };
    const result = await getMemberByUserId(input);

    expect(result).toBeNull();
  });

  it('should handle different member data variations', async () => {
    // Create user and member with nullable fields as null
    const userId = await createTestUser('different@example.com');
    await db.insert(membersTable)
      .values({
        user_id: userId,
        university_name: 'Different University',
        library_head_name: 'Alice Johnson',
        library_head_phone: '+6287654321098',
        pic_name: 'Bob Wilson',
        pic_phone: '+6287654321099',
        institution_address: 'Jl. Different No. 456, Surabaya',
        province: 'Jawa Barat',
        institution_email: 'info@different.edu',
        library_website_url: null, // nullable field
        opac_url: null, // nullable field
        repository_status: 'Belum',
        book_collection_count: 5000,
        accreditation_status: 'Belum Akreditasi',
        membership_status: 'Pending'
      })
      .execute();

    const input: GetMemberByUserIdInput = { user_id: userId };
    const result = await getMemberByUserId(input);

    expect(result).toBeDefined();
    expect(result?.user_id).toEqual(userId);
    expect(result?.university_name).toEqual('Different University');
    expect(result?.province).toEqual('Jawa Barat');
    expect(result?.library_website_url).toBeNull();
    expect(result?.opac_url).toBeNull();
    expect(result?.repository_status).toEqual('Belum');
    expect(result?.book_collection_count).toEqual(5000);
    expect(result?.accreditation_status).toEqual('Belum Akreditasi');
    expect(result?.membership_status).toEqual('Pending');
  });

  it('should return correct member when multiple users exist', async () => {
    // Create multiple users with members
    const userId1 = await createTestUser('user1@example.com');
    const userId2 = await createTestUser('user2@example.com');
    
    // Create member for user 1
    await createTestMember(userId1);
    
    // Create different member for user 2
    await db.insert(membersTable)
      .values({
        user_id: userId2,
        university_name: 'Second University',
        library_head_name: 'Different Head',
        library_head_phone: '+6285555555555',
        pic_name: 'Different PIC',
        pic_phone: '+6285555555556',
        institution_address: 'Different Address',
        province: 'Jawa Tengah',
        institution_email: 'different@second.edu',
        library_website_url: 'https://second.edu',
        opac_url: 'https://opac.second.edu',
        repository_status: 'Belum',
        book_collection_count: 15000,
        accreditation_status: 'Akreditasi B',
        membership_status: 'Inactive'
      })
      .execute();

    // Query for user 2's member
    const input: GetMemberByUserIdInput = { user_id: userId2 };
    const result = await getMemberByUserId(input);

    expect(result).toBeDefined();
    expect(result?.user_id).toEqual(userId2);
    expect(result?.university_name).toEqual('Second University');
    expect(result?.library_head_name).toEqual('Different Head');
    expect(result?.province).toEqual('Jawa Tengah');
    expect(result?.book_collection_count).toEqual(15000);
    expect(result?.accreditation_status).toEqual('Akreditasi B');
    expect(result?.membership_status).toEqual('Inactive');
  });
});