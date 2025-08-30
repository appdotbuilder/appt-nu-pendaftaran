import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable, registrationsTable } from '../db/schema';
import { type UpdatePaymentStatusInput } from '../schema';
import { updatePaymentStatus } from '../handlers/update_payment_status';
import { eq } from 'drizzle-orm';

describe('updatePaymentStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test data
  const createTestData = async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@university.edu',
        password_hash: 'hashed_password',
        role: 'Member'
      })
      .returning()
      .execute();

    // Create test member
    const member = await db.insert(membersTable)
      .values({
        user_id: user[0].id,
        university_name: 'Test University',
        library_head_name: 'Dr. John Doe',
        library_head_phone: '081234567890',
        pic_name: 'Jane Smith',
        pic_phone: '081234567891',
        institution_address: 'Jl. Test No. 123',
        province: 'Jawa Timur',
        institution_email: 'library@university.edu',
        library_website_url: 'https://library.university.edu',
        opac_url: 'https://opac.university.edu',
        repository_status: 'Sudah',
        book_collection_count: 50000,
        accreditation_status: 'Akreditasi A',
        membership_status: 'Pending'
      })
      .returning()
      .execute();

    // Create test registration
    const registration = await db.insert(registrationsTable)
      .values({
        member_id: member[0].id,
        registration_type: 'Pendaftaran Baru',
        payment_proof_url: 'https://example.com/payment-proof.jpg',
        payment_status: 'Pending'
      })
      .returning()
      .execute();

    return { user: user[0], member: member[0], registration: registration[0] };
  };

  it('should update payment status to Confirmed', async () => {
    const { registration } = await createTestData();

    const input: UpdatePaymentStatusInput = {
      registration_id: registration.id,
      payment_status: 'Confirmed'
    };

    const result = await updatePaymentStatus(input);

    expect(result.id).toEqual(registration.id);
    expect(result.payment_status).toEqual('Confirmed');
    expect(result.admin_notes).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(registration.updated_at.getTime());
  });

  it('should update payment status to Rejected with admin notes', async () => {
    const { registration } = await createTestData();

    const input: UpdatePaymentStatusInput = {
      registration_id: registration.id,
      payment_status: 'Rejected',
      admin_notes: 'Invalid payment proof document'
    };

    const result = await updatePaymentStatus(input);

    expect(result.id).toEqual(registration.id);
    expect(result.payment_status).toEqual('Rejected');
    expect(result.admin_notes).toEqual('Invalid payment proof document');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update payment status without changing admin notes when not provided', async () => {
    const { registration } = await createTestData();

    // First, set some admin notes
    await db.update(registrationsTable)
      .set({ admin_notes: 'Initial notes' })
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    const input: UpdatePaymentStatusInput = {
      registration_id: registration.id,
      payment_status: 'Confirmed'
      // admin_notes not provided
    };

    const result = await updatePaymentStatus(input);

    expect(result.payment_status).toEqual('Confirmed');
    expect(result.admin_notes).toEqual('Initial notes'); // Should remain unchanged
  });

  it('should clear admin notes when explicitly set to null', async () => {
    const { registration } = await createTestData();

    // First, set some admin notes
    await db.update(registrationsTable)
      .set({ admin_notes: 'Initial notes' })
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    const input: UpdatePaymentStatusInput = {
      registration_id: registration.id,
      payment_status: 'Confirmed',
      admin_notes: null
    };

    const result = await updatePaymentStatus(input);

    expect(result.payment_status).toEqual('Confirmed');
    expect(result.admin_notes).toBeNull();
  });

  it('should save updated data to database', async () => {
    const { registration } = await createTestData();

    const input: UpdatePaymentStatusInput = {
      registration_id: registration.id,
      payment_status: 'Confirmed',
      admin_notes: 'Payment verified'
    };

    await updatePaymentStatus(input);

    // Verify in database
    const updated = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    expect(updated).toHaveLength(1);
    expect(updated[0].payment_status).toEqual('Confirmed');
    expect(updated[0].admin_notes).toEqual('Payment verified');
    expect(updated[0].updated_at).toBeInstanceOf(Date);
    expect(updated[0].updated_at.getTime()).toBeGreaterThan(registration.updated_at.getTime());
  });

  it('should throw error when registration does not exist', async () => {
    const input: UpdatePaymentStatusInput = {
      registration_id: 99999, // Non-existent ID
      payment_status: 'Confirmed'
    };

    await expect(updatePaymentStatus(input)).rejects.toThrow(/Registration with ID 99999 not found/i);
  });

  it('should preserve other registration fields', async () => {
    const { registration } = await createTestData();

    const input: UpdatePaymentStatusInput = {
      registration_id: registration.id,
      payment_status: 'Confirmed',
      admin_notes: 'Approved by admin'
    };

    const result = await updatePaymentStatus(input);

    // Verify other fields are preserved
    expect(result.member_id).toEqual(registration.member_id);
    expect(result.registration_type).toEqual(registration.registration_type);
    expect(result.payment_proof_url).toEqual(registration.payment_proof_url);
    expect(result.receipt_url).toEqual(registration.receipt_url);
    expect(result.certificate_url).toEqual(registration.certificate_url);
    expect(result.created_at).toEqual(registration.created_at);
  });
});