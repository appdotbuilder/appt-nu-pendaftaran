import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable, registrationsTable } from '../db/schema';
import { type GetMemberByUserIdInput } from '../schema';
import { getMemberWithRegistrations } from '../handlers/get_member_with_registrations';

// Test data
const testUser = {
  email: 'test@university.edu',
  password_hash: 'hashed_password',
  role: 'Member' as const
};

const testMember = {
  user_id: 0, // Will be set after user creation
  university_name: 'Universitas Test',
  library_head_name: 'Dr. John Doe',
  library_head_phone: '081234567890',
  pic_name: 'Jane Smith',
  pic_phone: '081987654321',
  institution_address: 'Jl. Test No. 123, Kota Test',
  province: 'Jawa Timur' as const,
  institution_email: 'library@university.edu',
  library_website_url: 'https://library.university.edu',
  opac_url: 'https://opac.university.edu',
  repository_status: 'Sudah' as const,
  book_collection_count: 50000,
  accreditation_status: 'Akreditasi A' as const
};

const testRegistration1 = {
  member_id: 0, // Will be set after member creation
  registration_type: 'Pendaftaran Baru' as const,
  payment_proof_url: 'https://example.com/proof1.jpg'
};

const testRegistration2 = {
  member_id: 0, // Will be set after member creation
  registration_type: 'Perpanjangan' as const,
  payment_proof_url: 'https://example.com/proof2.jpg'
};

describe('getMemberWithRegistrations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return member with registrations when found', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    // Create member
    const memberData = { ...testMember, user_id: createdUser.id };
    const memberResult = await db.insert(membersTable)
      .values(memberData)
      .returning()
      .execute();
    const createdMember = memberResult[0];

    // Create registrations
    const registration1Data = { ...testRegistration1, member_id: createdMember.id };
    const registration2Data = { ...testRegistration2, member_id: createdMember.id };
    
    const registration1Result = await db.insert(registrationsTable)
      .values(registration1Data)
      .returning()
      .execute();
    
    const registration2Result = await db.insert(registrationsTable)
      .values(registration2Data)
      .returning()
      .execute();

    const input: GetMemberByUserIdInput = { user_id: createdUser.id };
    const result = await getMemberWithRegistrations(input);

    // Verify result structure
    expect(result).not.toBeNull();
    expect(result!.member).toBeDefined();
    expect(result!.registrations).toBeDefined();

    // Verify member data
    expect(result!.member.id).toEqual(createdMember.id);
    expect(result!.member.user_id).toEqual(createdUser.id);
    expect(result!.member.university_name).toEqual('Universitas Test');
    expect(result!.member.library_head_name).toEqual('Dr. John Doe');
    expect(result!.member.library_head_phone).toEqual('081234567890');
    expect(result!.member.pic_name).toEqual('Jane Smith');
    expect(result!.member.pic_phone).toEqual('081987654321');
    expect(result!.member.institution_address).toEqual('Jl. Test No. 123, Kota Test');
    expect(result!.member.province).toEqual('Jawa Timur');
    expect(result!.member.institution_email).toEqual('library@university.edu');
    expect(result!.member.library_website_url).toEqual('https://library.university.edu');
    expect(result!.member.opac_url).toEqual('https://opac.university.edu');
    expect(result!.member.repository_status).toEqual('Sudah');
    expect(result!.member.book_collection_count).toEqual(50000);
    expect(result!.member.accreditation_status).toEqual('Akreditasi A');
    expect(result!.member.membership_status).toEqual('Pending'); // Default value
    expect(result!.member.created_at).toBeInstanceOf(Date);
    expect(result!.member.updated_at).toBeInstanceOf(Date);

    // Verify registrations data
    expect(result!.registrations).toHaveLength(2);
    
    const registrationIds = result!.registrations.map(r => r.id).sort();
    const expectedIds = [registration1Result[0].id, registration2Result[0].id].sort();
    expect(registrationIds).toEqual(expectedIds);

    // Find specific registrations
    const newRegistration = result!.registrations.find(r => r.registration_type === 'Pendaftaran Baru');
    const renewalRegistration = result!.registrations.find(r => r.registration_type === 'Perpanjangan');

    expect(newRegistration).toBeDefined();
    expect(newRegistration!.member_id).toEqual(createdMember.id);
    expect(newRegistration!.payment_proof_url).toEqual('https://example.com/proof1.jpg');
    expect(newRegistration!.payment_status).toEqual('Pending'); // Default value
    expect(newRegistration!.admin_notes).toBeNull();
    expect(newRegistration!.receipt_url).toBeNull();
    expect(newRegistration!.certificate_url).toBeNull();
    expect(newRegistration!.created_at).toBeInstanceOf(Date);
    expect(newRegistration!.updated_at).toBeInstanceOf(Date);

    expect(renewalRegistration).toBeDefined();
    expect(renewalRegistration!.member_id).toEqual(createdMember.id);
    expect(renewalRegistration!.payment_proof_url).toEqual('https://example.com/proof2.jpg');
    expect(renewalRegistration!.payment_status).toEqual('Pending'); // Default value
  });

  it('should return member with empty registrations array when no registrations exist', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    // Create member without registrations
    const memberData = { ...testMember, user_id: createdUser.id };
    const memberResult = await db.insert(membersTable)
      .values(memberData)
      .returning()
      .execute();
    const createdMember = memberResult[0];

    const input: GetMemberByUserIdInput = { user_id: createdUser.id };
    const result = await getMemberWithRegistrations(input);

    expect(result).not.toBeNull();
    expect(result!.member.id).toEqual(createdMember.id);
    expect(result!.registrations).toHaveLength(0);
  });

  it('should return null when member does not exist for given user_id', async () => {
    // Create user but no member
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    const input: GetMemberByUserIdInput = { user_id: createdUser.id };
    const result = await getMemberWithRegistrations(input);

    expect(result).toBeNull();
  });

  it('should return null when user_id does not exist', async () => {
    const input: GetMemberByUserIdInput = { user_id: 99999 };
    const result = await getMemberWithRegistrations(input);

    expect(result).toBeNull();
  });

  it('should handle multiple registrations with different statuses', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const createdUser = userResult[0];

    // Create member
    const memberData = { ...testMember, user_id: createdUser.id };
    const memberResult = await db.insert(membersTable)
      .values(memberData)
      .returning()
      .execute();
    const createdMember = memberResult[0];

    // Create registrations with different statuses
    await db.insert(registrationsTable)
      .values([
        {
          member_id: createdMember.id,
          registration_type: 'Pendaftaran Baru',
          payment_proof_url: 'https://example.com/proof1.jpg',
          payment_status: 'Confirmed',
          admin_notes: 'Payment verified',
          receipt_url: 'https://example.com/receipt1.pdf'
        },
        {
          member_id: createdMember.id,
          registration_type: 'Perpanjangan',
          payment_proof_url: 'https://example.com/proof2.jpg',
          payment_status: 'Rejected',
          admin_notes: 'Invalid payment proof'
        },
        {
          member_id: createdMember.id,
          registration_type: 'Pendaftaran Baru',
          payment_proof_url: null,
          payment_status: 'Pending'
        }
      ])
      .execute();

    const input: GetMemberByUserIdInput = { user_id: createdUser.id };
    const result = await getMemberWithRegistrations(input);

    expect(result).not.toBeNull();
    expect(result!.registrations).toHaveLength(3);

    // Verify different payment statuses
    const statuses = result!.registrations.map(r => r.payment_status).sort();
    expect(statuses).toEqual(['Confirmed', 'Pending', 'Rejected']);

    // Verify confirmed registration has receipt URL
    const confirmedRegistration = result!.registrations.find(r => r.payment_status === 'Confirmed');
    expect(confirmedRegistration).toBeDefined();
    expect(confirmedRegistration!.receipt_url).toEqual('https://example.com/receipt1.pdf');
    expect(confirmedRegistration!.admin_notes).toEqual('Payment verified');

    // Verify rejected registration has admin notes
    const rejectedRegistration = result!.registrations.find(r => r.payment_status === 'Rejected');
    expect(rejectedRegistration).toBeDefined();
    expect(rejectedRegistration!.admin_notes).toEqual('Invalid payment proof');

    // Verify pending registration with null payment proof
    const pendingRegistration = result!.registrations.find(r => r.payment_status === 'Pending');
    expect(pendingRegistration).toBeDefined();
    expect(pendingRegistration!.payment_proof_url).toBeNull();
  });
});