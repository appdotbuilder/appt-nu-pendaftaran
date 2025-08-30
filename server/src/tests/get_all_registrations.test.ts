import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable, registrationsTable } from '../db/schema';
import { getAllRegistrations } from '../handlers/get_all_registrations';
import { type CreateUserInput, type CreateMemberInput, type CreateRegistrationInput } from '../schema';

// Test data setup
const testUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  role: 'Member'
};

const testMember: CreateMemberInput = {
  user_id: 1, // Will be set after user creation
  university_name: 'Test University',
  library_head_name: 'John Doe',
  library_head_phone: '081234567890',
  pic_name: 'Jane Smith',
  pic_phone: '081234567891',
  institution_address: 'Jl. Test No. 123',
  province: 'Jawa Timur',
  institution_email: 'library@test.edu',
  library_website_url: 'https://library.test.edu',
  opac_url: 'https://opac.test.edu',
  repository_status: 'Sudah',
  book_collection_count: 10000,
  accreditation_status: 'Akreditasi A'
};

const testRegistration1: CreateRegistrationInput = {
  member_id: 1, // Will be set after member creation
  registration_type: 'Pendaftaran Baru',
  payment_proof_url: 'https://example.com/proof1.jpg'
};

const testRegistration2: CreateRegistrationInput = {
  member_id: 1, // Will be set after member creation
  registration_type: 'Perpanjangan',
  payment_proof_url: null
};

describe('getAllRegistrations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no registrations exist', async () => {
    const result = await getAllRegistrations();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all registrations from database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashedpassword',
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create prerequisite member
    const memberResult = await db.insert(membersTable)
      .values({
        ...testMember,
        user_id: userId
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create multiple registrations
    await db.insert(registrationsTable)
      .values([
        {
          ...testRegistration1,
          member_id: memberId
        },
        {
          ...testRegistration2,
          member_id: memberId
        }
      ])
      .execute();

    const result = await getAllRegistrations();

    expect(result).toHaveLength(2);
    
    // Verify first registration
    expect(result[0].member_id).toEqual(memberId);
    expect(result[0].registration_type).toEqual('Pendaftaran Baru');
    expect(result[0].payment_proof_url).toEqual('https://example.com/proof1.jpg');
    expect(result[0].payment_status).toEqual('Pending'); // Default value
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second registration
    expect(result[1].member_id).toEqual(memberId);
    expect(result[1].registration_type).toEqual('Perpanjangan');
    expect(result[1].payment_proof_url).toBeNull();
    expect(result[1].payment_status).toEqual('Pending'); // Default value
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);

    // Verify IDs are different
    expect(result[0].id).not.toEqual(result[1].id);
  });

  it('should return registrations with different payment statuses', async () => {
    // Create prerequisite user and member
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashedpassword',
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const memberResult = await db.insert(membersTable)
      .values({
        ...testMember,
        user_id: userId
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create registrations with different payment statuses
    await db.insert(registrationsTable)
      .values([
        {
          member_id: memberId,
          registration_type: 'Pendaftaran Baru',
          payment_proof_url: 'https://example.com/proof1.jpg',
          payment_status: 'Pending'
        },
        {
          member_id: memberId,
          registration_type: 'Perpanjangan',
          payment_proof_url: 'https://example.com/proof2.jpg',
          payment_status: 'Confirmed'
        },
        {
          member_id: memberId,
          registration_type: 'Pendaftaran Baru',
          payment_proof_url: 'https://example.com/proof3.jpg',
          payment_status: 'Rejected'
        }
      ])
      .execute();

    const result = await getAllRegistrations();

    expect(result).toHaveLength(3);
    
    // Verify different payment statuses are returned
    const paymentStatuses = result.map(r => r.payment_status);
    expect(paymentStatuses).toContain('Pending');
    expect(paymentStatuses).toContain('Confirmed');
    expect(paymentStatuses).toContain('Rejected');
  });

  it('should return registrations with proper date types', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashedpassword',
        role: testUser.role
      })
      .returning()
      .execute();

    const memberResult = await db.insert(membersTable)
      .values({
        ...testMember,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create registration
    await db.insert(registrationsTable)
      .values({
        member_id: memberResult[0].id,
        registration_type: 'Pendaftaran Baru',
        payment_proof_url: 'https://example.com/proof.jpg'
      })
      .execute();

    const result = await getAllRegistrations();

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    // Verify dates are reasonable (created recently)
    const now = new Date();
    const timeDiff = now.getTime() - result[0].created_at.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute ago
  });
});