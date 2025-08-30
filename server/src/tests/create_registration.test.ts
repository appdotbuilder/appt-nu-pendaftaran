import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { registrationsTable, membersTable, usersTable } from '../db/schema';
import { type CreateRegistrationInput } from '../schema';
import { createRegistration } from '../handlers/create_registration';
import { eq } from 'drizzle-orm';

// Test data setup
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

const createTestMember = async (userId: number) => {
  const result = await db.insert(membersTable)
    .values({
      user_id: userId,
      university_name: 'Test University',
      library_head_name: 'Dr. John Doe',
      library_head_phone: '08123456789',
      pic_name: 'Jane Smith',
      pic_phone: '08987654321',
      institution_address: 'Jl. Test No. 123, Test City',
      province: 'Jawa Timur',
      institution_email: 'library@testuniv.edu',
      library_website_url: 'https://library.testuniv.edu',
      opac_url: 'https://opac.testuniv.edu',
      repository_status: 'Sudah',
      book_collection_count: 50000,
      accreditation_status: 'Akreditasi A',
      membership_status: 'Active'
    })
    .returning()
    .execute();

  return result[0];
};

describe('createRegistration', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new membership registration', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);

    const testInput: CreateRegistrationInput = {
      member_id: member.id,
      registration_type: 'Pendaftaran Baru',
      payment_proof_url: 'https://example.com/payment-proof.jpg'
    };

    const result = await createRegistration(testInput);

    // Verify basic fields
    expect(result.member_id).toEqual(member.id);
    expect(result.registration_type).toEqual('Pendaftaran Baru');
    expect(result.payment_proof_url).toEqual('https://example.com/payment-proof.jpg');
    expect(result.payment_status).toEqual('Pending');
    expect(result.admin_notes).toBeNull();
    expect(result.receipt_url).toBeNull();
    expect(result.certificate_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a renewal registration', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);

    const testInput: CreateRegistrationInput = {
      member_id: member.id,
      registration_type: 'Perpanjangan',
      payment_proof_url: null
    };

    const result = await createRegistration(testInput);

    expect(result.member_id).toEqual(member.id);
    expect(result.registration_type).toEqual('Perpanjangan');
    expect(result.payment_proof_url).toBeNull();
    expect(result.payment_status).toEqual('Pending');
  });

  it('should save registration to database', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);

    const testInput: CreateRegistrationInput = {
      member_id: member.id,
      registration_type: 'Pendaftaran Baru',
      payment_proof_url: 'https://example.com/proof.pdf'
    };

    const result = await createRegistration(testInput);

    // Verify data was saved in database
    const registrations = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, result.id))
      .execute();

    expect(registrations).toHaveLength(1);
    const savedRegistration = registrations[0];
    
    expect(savedRegistration.member_id).toEqual(member.id);
    expect(savedRegistration.registration_type).toEqual('Pendaftaran Baru');
    expect(savedRegistration.payment_proof_url).toEqual('https://example.com/proof.pdf');
    expect(savedRegistration.payment_status).toEqual('Pending');
    expect(savedRegistration.created_at).toBeInstanceOf(Date);
    expect(savedRegistration.updated_at).toBeInstanceOf(Date);
  });

  it('should create registration without payment proof', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);

    const testInput: CreateRegistrationInput = {
      member_id: member.id,
      registration_type: 'Perpanjangan',
      payment_proof_url: null
    };

    const result = await createRegistration(testInput);

    expect(result.payment_proof_url).toBeNull();
    expect(result.payment_status).toEqual('Pending');
    
    // Verify in database
    const registrations = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, result.id))
      .execute();

    expect(registrations[0].payment_proof_url).toBeNull();
  });

  it('should throw error when member does not exist', async () => {
    const testInput: CreateRegistrationInput = {
      member_id: 999999, // Non-existent member ID
      registration_type: 'Pendaftaran Baru',
      payment_proof_url: 'https://example.com/proof.jpg'
    };

    await expect(createRegistration(testInput)).rejects.toThrow(/Member with id 999999 does not exist/i);
  });

  it('should create multiple registrations for same member', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);

    // Create first registration
    const firstInput: CreateRegistrationInput = {
      member_id: member.id,
      registration_type: 'Pendaftaran Baru',
      payment_proof_url: 'https://example.com/first-proof.jpg'
    };

    const firstResult = await createRegistration(firstInput);

    // Create second registration (renewal)
    const secondInput: CreateRegistrationInput = {
      member_id: member.id,
      registration_type: 'Perpanjangan',
      payment_proof_url: 'https://example.com/second-proof.jpg'
    };

    const secondResult = await createRegistration(secondInput);

    // Both should be created successfully
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.registration_type).toEqual('Pendaftaran Baru');
    expect(secondResult.registration_type).toEqual('Perpanjangan');

    // Verify both exist in database
    const allRegistrations = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.member_id, member.id))
      .execute();

    expect(allRegistrations).toHaveLength(2);
  });

  it('should handle all registration types correctly', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);

    const registrationTypes: Array<'Pendaftaran Baru' | 'Perpanjangan'> = [
      'Pendaftaran Baru',
      'Perpanjangan'
    ];

    for (const regType of registrationTypes) {
      const testInput: CreateRegistrationInput = {
        member_id: member.id,
        registration_type: regType,
        payment_proof_url: `https://example.com/proof-${regType}.jpg`
      };

      const result = await createRegistration(testInput);
      expect(result.registration_type).toEqual(regType);
    }
  });
});