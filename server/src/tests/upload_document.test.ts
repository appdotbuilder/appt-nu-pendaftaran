import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, membersTable, registrationsTable } from '../db/schema';
import { type UploadDocumentInput } from '../schema';
import { uploadDocument } from '../handlers/upload_document';
import { eq } from 'drizzle-orm';

describe('uploadDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  const createTestUser = async () => {
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@university.edu',
        password_hash: 'hashedpassword',
        role: 'Member'
      })
      .returning()
      .execute();
    return userResult[0];
  };

  const createTestMember = async (userId: number) => {
    const memberResult = await db.insert(membersTable)
      .values({
        user_id: userId,
        university_name: 'Test University',
        library_head_name: 'John Doe',
        library_head_phone: '081234567890',
        pic_name: 'Jane Smith',
        pic_phone: '081234567891',
        institution_address: 'Jl. Test No. 1',
        province: 'Jawa Timur',
        institution_email: 'library@testuni.edu',
        library_website_url: 'https://library.testuni.edu',
        opac_url: 'https://opac.testuni.edu',
        repository_status: 'Sudah',
        book_collection_count: 50000,
        accreditation_status: 'Akreditasi A',
        membership_status: 'Active'
      })
      .returning()
      .execute();
    return memberResult[0];
  };

  const createTestRegistration = async (memberId: number) => {
    const registrationResult = await db.insert(registrationsTable)
      .values({
        member_id: memberId,
        registration_type: 'Pendaftaran Baru',
        payment_proof_url: 'https://example.com/payment.pdf',
        payment_status: 'Confirmed',
        admin_notes: null,
        receipt_url: null,
        certificate_url: null
      })
      .returning()
      .execute();
    return registrationResult[0];
  };

  it('should upload receipt document successfully', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);
    const registration = await createTestRegistration(member.id);

    const input: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'receipt',
      document_url: 'https://example.com/receipt.pdf'
    };

    const result = await uploadDocument(input);

    // Verify response
    expect(result.id).toEqual(registration.id);
    expect(result.member_id).toEqual(member.id);
    expect(result.receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(result.certificate_url).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify database was updated
    const updatedRegistration = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    expect(updatedRegistration[0].receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(updatedRegistration[0].certificate_url).toBeNull();
  });

  it('should upload certificate document successfully', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);
    const registration = await createTestRegistration(member.id);

    const input: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'certificate',
      document_url: 'https://example.com/certificate.pdf'
    };

    const result = await uploadDocument(input);

    // Verify response
    expect(result.id).toEqual(registration.id);
    expect(result.member_id).toEqual(member.id);
    expect(result.certificate_url).toEqual('https://example.com/certificate.pdf');
    expect(result.receipt_url).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify database was updated
    const updatedRegistration = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    expect(updatedRegistration[0].certificate_url).toEqual('https://example.com/certificate.pdf');
    expect(updatedRegistration[0].receipt_url).toBeNull();
  });

  it('should update existing document URL when uploading new document', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);
    const registration = await createTestRegistration(member.id);

    // First upload
    const firstInput: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'receipt',
      document_url: 'https://example.com/old-receipt.pdf'
    };

    await uploadDocument(firstInput);

    // Second upload (should overwrite)
    const secondInput: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'receipt',
      document_url: 'https://example.com/new-receipt.pdf'
    };

    const result = await uploadDocument(secondInput);

    // Verify response has new URL
    expect(result.receipt_url).toEqual('https://example.com/new-receipt.pdf');

    // Verify database was updated
    const updatedRegistration = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    expect(updatedRegistration[0].receipt_url).toEqual('https://example.com/new-receipt.pdf');
  });

  it('should preserve existing documents when uploading different document type', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);
    const registration = await createTestRegistration(member.id);

    // Upload receipt first
    const receiptInput: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'receipt',
      document_url: 'https://example.com/receipt.pdf'
    };

    await uploadDocument(receiptInput);

    // Upload certificate
    const certificateInput: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'certificate',
      document_url: 'https://example.com/certificate.pdf'
    };

    const result = await uploadDocument(certificateInput);

    // Verify both documents exist
    expect(result.receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(result.certificate_url).toEqual('https://example.com/certificate.pdf');

    // Verify database has both documents
    const updatedRegistration = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    expect(updatedRegistration[0].receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(updatedRegistration[0].certificate_url).toEqual('https://example.com/certificate.pdf');
  });

  it('should throw error when registration does not exist', async () => {
    const input: UploadDocumentInput = {
      registration_id: 999, // Non-existent ID
      document_type: 'receipt',
      document_url: 'https://example.com/receipt.pdf'
    };

    await expect(() => uploadDocument(input))
      .toThrow(/Registration with id 999 not found/i);
  });

  it('should update the updated_at timestamp', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);
    const registration = await createTestRegistration(member.id);

    const originalUpdatedAt = registration.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'receipt',
      document_url: 'https://example.com/receipt.pdf'
    };

    const result = await uploadDocument(input);

    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

    // Verify in database
    const updatedRegistration = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, registration.id))
      .execute();

    expect(updatedRegistration[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should preserve other registration fields when uploading document', async () => {
    // Setup test data
    const user = await createTestUser();
    const member = await createTestMember(user.id);
    const registration = await createTestRegistration(member.id);

    const input: UploadDocumentInput = {
      registration_id: registration.id,
      document_type: 'receipt',
      document_url: 'https://example.com/receipt.pdf'
    };

    const result = await uploadDocument(input);

    // Verify all other fields are preserved
    expect(result.member_id).toEqual(registration.member_id);
    expect(result.registration_type).toEqual(registration.registration_type);
    expect(result.payment_proof_url).toEqual(registration.payment_proof_url);
    expect(result.payment_status).toEqual(registration.payment_status);
    expect(result.admin_notes).toEqual(registration.admin_notes);
    expect(result.created_at).toEqual(registration.created_at);
  });
});