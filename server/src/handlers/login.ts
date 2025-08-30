import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // For simplicity, we'll do a direct password comparison
    // In production, this should use bcrypt or similar to compare hashed passwords
    if (user.password_hash !== input.password) {
      throw new Error('Invalid email or password');
    }

    // Return user data without password hash
    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
      // Note: Not implementing JWT token generation for simplicity
      // In production, would generate and return JWT token here
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};