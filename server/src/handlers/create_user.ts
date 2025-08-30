import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password - using a simple hash for demonstration
    // In production, use bcrypt or similar
    const passwordHash = await hashPassword(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: passwordHash,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

// Simple password hashing function - in production use bcrypt
async function hashPassword(password: string): Promise<string> {
  // Using Node.js built-in crypto for demonstration
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}