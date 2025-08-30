import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'test@university.edu',
        password_hash: 'hashedpassword123',
        role: 'Member'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestInput = (user_id: number): CreateMemberInput => ({
    user_id,
    university_name: 'Universitas Test Indonesia',
    library_head_name: 'Dr. Budi Santoso',
    library_head_phone: '081234567890',
    pic_name: 'Siti Nurhaliza',
    pic_phone: '081987654321',
    institution_address: 'Jl. Pendidikan No. 123, Jakarta',
    province: 'Jawa Barat',
    institution_email: 'library@test-university.ac.id',
    library_website_url: 'https://library.test-university.ac.id',
    opac_url: 'https://opac.test-university.ac.id',
    repository_status: 'Sudah',
    book_collection_count: 50000,
    accreditation_status: 'Akreditasi A'
  });

  it('should create a member successfully', async () => {
    const user = await createTestUser();
    const input = createTestInput(user.id);

    const result = await createMember(input);

    // Verify all fields are properly set
    expect(result.id).toBeDefined();
    expect(result.user_id).toBe(user.id);
    expect(result.university_name).toBe('Universitas Test Indonesia');
    expect(result.library_head_name).toBe('Dr. Budi Santoso');
    expect(result.library_head_phone).toBe('081234567890');
    expect(result.pic_name).toBe('Siti Nurhaliza');
    expect(result.pic_phone).toBe('081987654321');
    expect(result.institution_address).toBe('Jl. Pendidikan No. 123, Jakarta');
    expect(result.province).toBe('Jawa Barat');
    expect(result.institution_email).toBe('library@test-university.ac.id');
    expect(result.library_website_url).toBe('https://library.test-university.ac.id');
    expect(result.opac_url).toBe('https://opac.test-university.ac.id');
    expect(result.repository_status).toBe('Sudah');
    expect(result.book_collection_count).toBe(50000);
    expect(result.accreditation_status).toBe('Akreditasi A');
    expect(result.membership_status).toBe('Pending'); // Default value
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save member to database', async () => {
    const user = await createTestUser();
    const input = createTestInput(user.id);

    const result = await createMember(input);

    // Query database to verify member was saved
    const savedMembers = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(savedMembers).toHaveLength(1);
    const savedMember = savedMembers[0];
    
    expect(savedMember.user_id).toBe(user.id);
    expect(savedMember.university_name).toBe('Universitas Test Indonesia');
    expect(savedMember.library_head_name).toBe('Dr. Budi Santoso');
    expect(savedMember.province).toBe('Jawa Barat');
    expect(savedMember.membership_status).toBe('Pending');
    expect(savedMember.book_collection_count).toBe(50000);
  });

  it('should handle null URLs correctly', async () => {
    const user = await createTestUser();
    const input: CreateMemberInput = {
      ...createTestInput(user.id),
      library_website_url: null,
      opac_url: null
    };

    const result = await createMember(input);

    expect(result.library_website_url).toBeNull();
    expect(result.opac_url).toBeNull();
    
    // Verify in database
    const savedMembers = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();
    
    expect(savedMembers[0].library_website_url).toBeNull();
    expect(savedMembers[0].opac_url).toBeNull();
  });

  it('should create member with different province values', async () => {
    const user = await createTestUser();
    
    // Test each province enum value
    const provinces = ['Jawa Timur', 'Jawa Barat', 'Jawa Tengah'] as const;
    
    for (const province of provinces) {
      const input = createTestInput(user.id);
      input.province = province;
      input.institution_email = `library-${province.toLowerCase().replace(' ', '')}@test.ac.id`;
      
      const result = await createMember(input);
      expect(result.province).toBe(province);
    }
  });

  it('should create member with different repository and accreditation statuses', async () => {
    const user = await createTestUser();
    
    // Test different status combinations
    const testCases = [
      { repository_status: 'Belum' as const, accreditation_status: 'Belum Akreditasi' as const },
      { repository_status: 'Sudah' as const, accreditation_status: 'Akreditasi B' as const },
      { repository_status: 'Sudah' as const, accreditation_status: 'Akreditasi A' as const }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const input = createTestInput(user.id);
      input.repository_status = testCase.repository_status;
      input.accreditation_status = testCase.accreditation_status;
      input.institution_email = `library${i}@test.ac.id`; // Unique email for each test
      
      const result = await createMember(input);
      expect(result.repository_status).toBe(testCase.repository_status);
      expect(result.accreditation_status).toBe(testCase.accreditation_status);
    }
  });

  it('should throw error when user_id does not exist', async () => {
    const nonExistentUserId = 999999;
    const input = createTestInput(nonExistentUserId);

    await expect(createMember(input)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple members for different users', async () => {
    // Create two different users
    const user1 = await createTestUser();
    const user2 = await db.insert(usersTable)
      .values({
        email: 'test2@university.edu',
        password_hash: 'hashedpassword456',
        role: 'Member'
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const input1 = createTestInput(user1.id);
    const input2 = createTestInput(user2.id);
    input2.university_name = 'Universitas Test Jakarta';
    input2.institution_email = 'library@test-jakarta.ac.id';

    const member1 = await createMember(input1);
    const member2 = await createMember(input2);

    expect(member1.user_id).toBe(user1.id);
    expect(member2.user_id).toBe(user2.id);
    expect(member1.university_name).toBe('Universitas Test Indonesia');
    expect(member2.university_name).toBe('Universitas Test Jakarta');
    expect(member1.id).not.toBe(member2.id);
  });
});