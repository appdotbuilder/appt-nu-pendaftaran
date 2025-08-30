import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs with different roles
const memberInput: CreateUserInput = {
  email: 'member@test.com',
  password: 'password123',
  role: 'Member'
};

const adminInput: CreateUserInput = {
  email: 'admin@test.com',
  password: 'adminpass456',
  role: 'Admin'
};

const defaultRoleInput = {
  email: 'default@test.com',
  password: 'defaultpass789'
  // role not specified - should default to 'Member'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member user', async () => {
    const result = await createUser(memberInput);

    // Basic field validation
    expect(result.email).toEqual('member@test.com');
    expect(result.role).toEqual('Member');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an admin user', async () => {
    const result = await createUser(adminInput);

    // Basic field validation
    expect(result.email).toEqual('admin@test.com');
    expect(result.role).toEqual('Admin');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('adminpass456'); // Should be hashed
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should default to Member role when role not specified', async () => {
    const result = await createUser(defaultRoleInput as CreateUserInput);

    expect(result.email).toEqual('default@test.com');
    expect(result.role).toEqual('Member'); // Should default to Member
    expect(result.password_hash).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('should save user to database', async () => {
    const result = await createUser(memberInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('member@test.com');
    expect(users[0].role).toEqual('Member');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].password_hash).not.toEqual('password123');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash password consistently', async () => {
    const user1 = await createUser({
      email: 'user1@test.com',
      password: 'samepassword',
      role: 'Member'
    });

    const user2 = await createUser({
      email: 'user2@test.com',
      password: 'samepassword',
      role: 'Member'
    });

    // Same password should produce same hash (with simple sha256)
    expect(user1.password_hash).toEqual(user2.password_hash);
    expect(user1.password_hash).not.toEqual('samepassword');
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(memberInput);

    // Try to create second user with same email
    const duplicateEmailInput = {
      ...memberInput,
      password: 'differentpassword'
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/unique/i);
  });

  it('should create user even with malformed email (validation happens at API layer)', async () => {
    const malformedEmailInput = {
      email: 'invalid-email',
      password: 'password123',
      role: 'Member' as const
    };

    // The handler itself doesn't validate email format
    // Email validation happens at the schema/API layer before reaching the handler
    const result = await createUser(malformedEmailInput as CreateUserInput);
    
    expect(result.email).toEqual('invalid-email');
    expect(result.role).toEqual('Member');
    expect(result.password_hash).toBeDefined();
  });

  it('should query users by role correctly', async () => {
    // Create users with different roles
    await createUser(memberInput);
    await createUser(adminInput);
    await createUser({
      email: 'member2@test.com',
      password: 'password789',
      role: 'Member'
    });

    // Query only Member users
    const memberUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.role, 'Member'))
      .execute();

    expect(memberUsers).toHaveLength(2);
    memberUsers.forEach(user => {
      expect(user.role).toEqual('Member');
    });

    // Query only Admin users
    const adminUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.role, 'Admin'))
      .execute();

    expect(adminUsers).toHaveLength(1);
    expect(adminUsers[0].role).toEqual('Admin');
    expect(adminUsers[0].email).toEqual('admin@test.com');
  });
});