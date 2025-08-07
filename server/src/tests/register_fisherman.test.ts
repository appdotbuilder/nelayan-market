
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, fishermenProfilesTable } from '../db/schema';
import { type RegisterFishermanInput } from '../schema';
import { registerFisherman } from '../handlers/register_fisherman';
import { eq } from 'drizzle-orm';

// Test input
const testInput: RegisterFishermanInput = {
  full_name: 'John Fisher',
  email: 'john.fisher@example.com',
  phone_number: '+1234567890',
  password: 'securePassword123',
  catch_location: 'Pacific Coast Marina'
};

describe('registerFisherman', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a fisherman user', async () => {
    const result = await registerFisherman(testInput);

    // Basic field validation
    expect(result.full_name).toEqual('John Fisher');
    expect(result.email).toEqual('john.fisher@example.com');
    expect(result.phone_number).toEqual('+1234567890');
    expect(result.password_hash).toEqual('hashed_securePassword123');
    expect(result.role).toEqual('fisherman');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await registerFisherman(testInput);

    // Query user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].full_name).toEqual('John Fisher');
    expect(users[0].email).toEqual('john.fisher@example.com');
    expect(users[0].role).toEqual('fisherman');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should create fisherman profile', async () => {
    const result = await registerFisherman(testInput);

    // Query fisherman profile from database
    const profiles = await db.select()
      .from(fishermenProfilesTable)
      .where(eq(fishermenProfilesTable.user_id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].user_id).toEqual(result.id);
    expect(profiles[0].catch_location).toEqual('Pacific Coast Marina');
    expect(profiles[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate email registration', async () => {
    // Register first fisherman
    await registerFisherman(testInput);

    // Try to register another with same email
    const duplicateInput: RegisterFishermanInput = {
      ...testInput,
      full_name: 'Jane Fisher',
      phone_number: '+0987654321'
    };

    expect(registerFisherman(duplicateInput)).rejects.toThrow();
  });

  it('should hash the password', async () => {
    const result = await registerFisherman(testInput);

    // Password should be hashed, not stored in plain text
    expect(result.password_hash).not.toEqual(testInput.password);
    expect(result.password_hash).toEqual('hashed_securePassword123');
  });
});
