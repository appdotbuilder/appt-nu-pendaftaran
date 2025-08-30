import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable, registrationsTable } from '../db/schema';
import { type GetRegistrationsByMemberIdInput } from '../schema';
import { getRegistrationsByMemberId } from '../handlers/get_registrations_by_member_id';

// Test input
const testInput: GetRegistrationsByMemberIdInput = {
  member_id: 1
};

describe('getRegistrationsByMemberId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no registrations exist for member', async () => {
    const result = await getRegistrationsByMemberId(testInput);
    expect(result).toEqual([]);
  });

  it('should fetch all registrations for a specific member', async () => {
    // Create prerequisite user and member first
    const userResult = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      role: 'Member'
    }).returning().execute();

    const memberResult = await db.insert(membersTable).values({
      user_id: userResult[0].id,
      university_name: 'Test University',
      library_head_name: 'John Doe',
      library_head_phone: '081234567890',
      pic_name: 'Jane Smith',
      pic_phone: '081234567891',
      institution_address: '123 University Street',
      province: 'Jawa Timur',
      institution_email: 'library@test.edu',
      library_website_url: 'https://library.test.edu',
      opac_url: 'https://opac.test.edu',
      repository_status: 'Sudah',
      book_collection_count: 10000,
      accreditation_status: 'Akreditasi A',
      membership_status: 'Pending'
    }).returning().execute();

    // Create multiple registrations for this member
    const registration1 = await db.insert(registrationsTable).values({
      member_id: memberResult[0].id,
      registration_type: 'Pendaftaran Baru',
      payment_proof_url: 'https://example.com/payment1.jpg',
      payment_status: 'Pending'
    }).returning().execute();

    const registration2 = await db.insert(registrationsTable).values({
      member_id: memberResult[0].id,
      registration_type: 'Perpanjangan',
      payment_proof_url: 'https://example.com/payment2.jpg',
      payment_status: 'Confirmed',
      admin_notes: 'Payment confirmed',
      receipt_url: 'https://example.com/receipt.pdf'
    }).returning().execute();

    // Test the handler
    const result = await getRegistrationsByMemberId({ member_id: memberResult[0].id });

    expect(result).toHaveLength(2);
    
    // Verify first registration
    const firstReg = result.find(r => r.registration_type === 'Pendaftaran Baru');
    expect(firstReg).toBeDefined();
    expect(firstReg!.member_id).toEqual(memberResult[0].id);
    expect(firstReg!.payment_proof_url).toEqual('https://example.com/payment1.jpg');
    expect(firstReg!.payment_status).toEqual('Pending');
    expect(firstReg!.id).toBeDefined();
    expect(firstReg!.created_at).toBeInstanceOf(Date);
    expect(firstReg!.updated_at).toBeInstanceOf(Date);

    // Verify second registration
    const secondReg = result.find(r => r.registration_type === 'Perpanjangan');
    expect(secondReg).toBeDefined();
    expect(secondReg!.member_id).toEqual(memberResult[0].id);
    expect(secondReg!.payment_proof_url).toEqual('https://example.com/payment2.jpg');
    expect(secondReg!.payment_status).toEqual('Confirmed');
    expect(secondReg!.admin_notes).toEqual('Payment confirmed');
    expect(secondReg!.receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(secondReg!.id).toBeDefined();
    expect(secondReg!.created_at).toBeInstanceOf(Date);
    expect(secondReg!.updated_at).toBeInstanceOf(Date);
  });

  it('should only return registrations for the specified member', async () => {
    // Create two users and members
    const user1 = await db.insert(usersTable).values({
      email: 'user1@example.com',
      password_hash: 'hashed_password1',
      role: 'Member'
    }).returning().execute();

    const user2 = await db.insert(usersTable).values({
      email: 'user2@example.com',
      password_hash: 'hashed_password2',
      role: 'Member'
    }).returning().execute();

    const member1 = await db.insert(membersTable).values({
      user_id: user1[0].id,
      university_name: 'University One',
      library_head_name: 'Head One',
      library_head_phone: '081234567890',
      pic_name: 'PIC One',
      pic_phone: '081234567891',
      institution_address: '123 One Street',
      province: 'Jawa Timur',
      institution_email: 'library1@test.edu',
      repository_status: 'Sudah',
      book_collection_count: 5000,
      accreditation_status: 'Akreditasi A',
      membership_status: 'Active'
    }).returning().execute();

    const member2 = await db.insert(membersTable).values({
      user_id: user2[0].id,
      university_name: 'University Two',
      library_head_name: 'Head Two',
      library_head_phone: '081234567892',
      pic_name: 'PIC Two',
      pic_phone: '081234567893',
      institution_address: '456 Two Street',
      province: 'Jawa Barat',
      institution_email: 'library2@test.edu',
      repository_status: 'Belum',
      book_collection_count: 8000,
      accreditation_status: 'Akreditasi B',
      membership_status: 'Pending'
    }).returning().execute();

    // Create registrations for both members
    await db.insert(registrationsTable).values({
      member_id: member1[0].id,
      registration_type: 'Pendaftaran Baru',
      payment_status: 'Confirmed'
    }).execute();

    await db.insert(registrationsTable).values({
      member_id: member2[0].id,
      registration_type: 'Perpanjangan',
      payment_status: 'Pending'
    }).execute();

    // Test that we only get registrations for member1
    const result = await getRegistrationsByMemberId({ member_id: member1[0].id });

    expect(result).toHaveLength(1);
    expect(result[0].member_id).toEqual(member1[0].id);
    expect(result[0].registration_type).toEqual('Pendaftaran Baru');
    expect(result[0].payment_status).toEqual('Confirmed');
  });

  it('should handle registrations with all nullable fields populated', async () => {
    // Create prerequisite user and member
    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      role: 'Member'
    }).returning().execute();

    const member = await db.insert(membersTable).values({
      user_id: user[0].id,
      university_name: 'Test University',
      library_head_name: 'John Doe',
      library_head_phone: '081234567890',
      pic_name: 'Jane Smith',
      pic_phone: '081234567891',
      institution_address: '123 University Street',
      province: 'Jawa Tengah',
      institution_email: 'library@test.edu',
      repository_status: 'Sudah',
      book_collection_count: 15000,
      accreditation_status: 'Belum Akreditasi',
      membership_status: 'Active'
    }).returning().execute();

    // Create registration with all optional fields populated
    await db.insert(registrationsTable).values({
      member_id: member[0].id,
      registration_type: 'Perpanjangan',
      payment_proof_url: 'https://example.com/payment.jpg',
      payment_status: 'Confirmed',
      admin_notes: 'All documents verified',
      receipt_url: 'https://example.com/receipt.pdf',
      certificate_url: 'https://example.com/certificate.pdf'
    }).execute();

    const result = await getRegistrationsByMemberId({ member_id: member[0].id });

    expect(result).toHaveLength(1);
    expect(result[0].payment_proof_url).toEqual('https://example.com/payment.jpg');
    expect(result[0].admin_notes).toEqual('All documents verified');
    expect(result[0].receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(result[0].certificate_url).toEqual('https://example.com/certificate.pdf');
  });

  it('should handle registrations with nullable fields as null', async () => {
    // Create prerequisite user and member
    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      role: 'Member'
    }).returning().execute();

    const member = await db.insert(membersTable).values({
      user_id: user[0].id,
      university_name: 'Test University',
      library_head_name: 'John Doe',
      library_head_phone: '081234567890',
      pic_name: 'Jane Smith',
      pic_phone: '081234567891',
      institution_address: '123 University Street',
      province: 'Jawa Tengah',
      institution_email: 'library@test.edu',
      repository_status: 'Belum',
      book_collection_count: 3000,
      accreditation_status: 'Akreditasi B',
      membership_status: 'Inactive'
    }).returning().execute();

    // Create registration with minimal required fields only
    await db.insert(registrationsTable).values({
      member_id: member[0].id,
      registration_type: 'Pendaftaran Baru',
      payment_status: 'Pending'
    }).execute();

    const result = await getRegistrationsByMemberId({ member_id: member[0].id });

    expect(result).toHaveLength(1);
    expect(result[0].payment_proof_url).toBeNull();
    expect(result[0].admin_notes).toBeNull();
    expect(result[0].receipt_url).toBeNull();
    expect(result[0].certificate_url).toBeNull();
  });
});