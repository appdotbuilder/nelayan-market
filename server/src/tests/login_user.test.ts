
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  full_name: 'Test Fisherman',
  email: 'test@example.com',
  phone_number: '+1234567890',
  password_hash: 'testpassword123', // In real app, this would be hashed
  role: 'fisherman' as const
};

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when credentials are valid', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(loginInput);

    expect(result).toBeDefined();
    expect(result?.email).toEqual('test@example.com');
    expect(result?.full_name).toEqual('Test Fisherman');
    expect(result?.role).toEqual('fisherman');
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when email does not exist', async () => {
    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'testpassword123'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should return null when password is incorrect', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(invalidInput);

    expect(result).toBeNull();
  });

  it('should work with buyer role', async () => {
    const buyerUser = {
      ...testUser,
      email: 'buyer@example.com',
      role: 'buyer' as const
    };

    await db.insert(usersTable)
      .values(buyerUser)
      .execute();

    const buyerLogin: LoginInput = {
      email: 'buyer@example.com',
      password: 'testpassword123'
    };

    const result = await loginUser(buyerLogin);

    expect(result).toBeDefined();
    expect(result?.role).toEqual('buyer');
    expect(result?.email).toEqual('buyer@example.com');
  });

  it('should be case sensitive for email', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const uppercaseEmailInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'testpassword123'
    };

    const result = await loginUser(uppercaseEmailInput);

    expect(result).toBeNull();
  });
});
