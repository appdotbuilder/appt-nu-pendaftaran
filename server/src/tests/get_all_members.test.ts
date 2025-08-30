import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable } from '../db/schema';
import { getAllMembers } from '../handlers/get_all_members';

describe('getAllMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no members exist', async () => {
    const result = await getAllMembers();
    expect(result).toEqual([]);
  });

  it('should return all members when they exist', async () => {
    // Create test users first
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'user1@test.com',
          password_hash: 'hash1',
          role: 'Member'
        },
        {
          email: 'user2@test.com', 
          password_hash: 'hash2',
          role: 'Member'
        }
      ])
      .returning()
      .execute();

    // Create test members
    await db.insert(membersTable)
      .values([
        {
          user_id: userResults[0].id,
          university_name: 'Universitas Test 1',
          library_head_name: 'Kepala Perpus 1',
          library_head_phone: '08123456789',
          pic_name: 'PIC 1',
          pic_phone: '08234567890',
          institution_address: 'Jl. Test 1 No. 1',
          province: 'Jawa Timur',
          institution_email: 'lib1@test.edu',
          library_website_url: 'https://lib1.test.edu',
          opac_url: 'https://opac1.test.edu',
          repository_status: 'Sudah',
          book_collection_count: 10000,
          accreditation_status: 'Akreditasi A',
          membership_status: 'Active'
        },
        {
          user_id: userResults[1].id,
          university_name: 'Universitas Test 2',
          library_head_name: 'Kepala Perpus 2',
          library_head_phone: '08345678901',
          pic_name: 'PIC 2',
          pic_phone: '08456789012',
          institution_address: 'Jl. Test 2 No. 2',
          province: 'Jawa Barat',
          institution_email: 'lib2@test.edu',
          library_website_url: null,
          opac_url: null,
          repository_status: 'Belum',
          book_collection_count: 5000,
          accreditation_status: 'Akreditasi B',
          membership_status: 'Pending'
        }
      ])
      .execute();

    const result = await getAllMembers();

    expect(result).toHaveLength(2);
    
    // Verify first member
    const member1 = result.find(m => m.university_name === 'Universitas Test 1');
    expect(member1).toBeDefined();
    expect(member1!.user_id).toEqual(userResults[0].id);
    expect(member1!.library_head_name).toEqual('Kepala Perpus 1');
    expect(member1!.province).toEqual('Jawa Timur');
    expect(member1!.membership_status).toEqual('Active');
    expect(member1!.book_collection_count).toEqual(10000);
    expect(member1!.created_at).toBeInstanceOf(Date);
    expect(member1!.updated_at).toBeInstanceOf(Date);

    // Verify second member
    const member2 = result.find(m => m.university_name === 'Universitas Test 2');
    expect(member2).toBeDefined();
    expect(member2!.user_id).toEqual(userResults[1].id);
    expect(member2!.library_head_name).toEqual('Kepala Perpus 2');
    expect(member2!.province).toEqual('Jawa Barat');
    expect(member2!.membership_status).toEqual('Pending');
    expect(member2!.book_collection_count).toEqual(5000);
    expect(member2!.library_website_url).toBeNull();
    expect(member2!.opac_url).toBeNull();
  });

  it('should return members in insertion order', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@test.com',
        password_hash: 'hash',
        role: 'Member'
      })
      .returning()
      .execute();

    // Create multiple members with distinct names for ordering verification
    const memberData = [
      { name: 'Alpha University', status: 'Active' as const },
      { name: 'Beta University', status: 'Pending' as const },
      { name: 'Gamma University', status: 'Inactive' as const }
    ];

    for (const data of memberData) {
      await db.insert(membersTable)
        .values({
          user_id: userResult[0].id,
          university_name: data.name,
          library_head_name: 'Head',
          library_head_phone: '08123456789',
          pic_name: 'PIC',
          pic_phone: '08234567890',
          institution_address: 'Address',
          province: 'Jawa Tengah',
          institution_email: `${data.name.toLowerCase().replace(' ', '')}@test.edu`,
          repository_status: 'Belum',
          book_collection_count: 1000,
          accreditation_status: 'Belum Akreditasi',
          membership_status: data.status
        })
        .execute();
    }

    const result = await getAllMembers();

    expect(result).toHaveLength(3);
    expect(result[0].university_name).toEqual('Alpha University');
    expect(result[1].university_name).toEqual('Beta University'); 
    expect(result[2].university_name).toEqual('Gamma University');
  });

  it('should handle members with different enum values correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'enum@test.com',
        password_hash: 'hash',
        role: 'Member'
      })
      .returning()
      .execute();

    // Create member with all enum combinations
    await db.insert(membersTable)
      .values({
        user_id: userResult[0].id,
        university_name: 'Enum Test University',
        library_head_name: 'Head',
        library_head_phone: '08123456789',
        pic_name: 'PIC',
        pic_phone: '08234567890',
        institution_address: 'Address',
        province: 'Jawa Tengah',
        institution_email: 'enum@test.edu',
        repository_status: 'Sudah',
        book_collection_count: 15000,
        accreditation_status: 'Akreditasi A',
        membership_status: 'Rejected'
      })
      .execute();

    const result = await getAllMembers();

    expect(result).toHaveLength(1);
    const member = result[0];
    
    expect(member.province).toEqual('Jawa Tengah');
    expect(member.repository_status).toEqual('Sudah');
    expect(member.accreditation_status).toEqual('Akreditasi A');
    expect(member.membership_status).toEqual('Rejected');
  });
});