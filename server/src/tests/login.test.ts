import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUser = {
    email: 'test@example.com',
    password_hash: 'test_password',
    role: 'Member' as const
  };

  const validLoginInput: LoginInput = {
    email: 'test@example.com',
    password: 'test_password'
  };

  beforeEach(async () => {
    // Create a test user before each test
    await db.insert(usersTable)
      .values(testUser)
      .execute();
  });

  it('should authenticate user with valid credentials', async () => {
    const result = await login(validLoginInput);

    // Verify user data is returned correctly
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe('Member');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    expect(result.user.password_hash).toBe('test_password');
  });

  it('should return user with correct role', async () => {
    // Create admin user
    await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'admin_password',
        role: 'Admin'
      })
      .execute();

    const adminLoginInput: LoginInput = {
      email: 'admin@example.com',
      password: 'admin_password'
    };

    const result = await login(adminLoginInput);
    expect(result.user.role).toBe('Admin');
    expect(result.user.email).toBe('admin@example.com');
  });

  it('should throw error for non-existent email', async () => {
    const invalidEmailInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'any_password'
    };

    await expect(login(invalidEmailInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    const wrongPasswordInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrong_password'
    };

    await expect(login(wrongPasswordInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle case-sensitive email matching', async () => {
    const caseVariationInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'test_password'
    };

    // Should fail because email case doesn't match exactly
    await expect(login(caseVariationInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should authenticate multiple different users', async () => {
    // Create second user
    await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'password123',
        role: 'Member'
      })
      .execute();

    // Test first user login
    const result1 = await login({
      email: 'test@example.com',
      password: 'test_password'
    });

    // Test second user login
    const result2 = await login({
      email: 'user2@example.com',
      password: 'password123'
    });

    expect(result1.user.email).toBe('test@example.com');
    expect(result2.user.email).toBe('user2@example.com');
    expect(result1.user.id).not.toBe(result2.user.id);
  });
});