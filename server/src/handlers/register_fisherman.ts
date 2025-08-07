
import { db } from '../db';
import { usersTable, fishermenProfilesTable } from '../db/schema';
import { type RegisterFishermanInput, type User } from '../schema';

export async function registerFisherman(input: RegisterFishermanInput): Promise<User> {
  try {
    // Hash the password (simple hash for demo - in production use bcrypt or similar)
    const password_hash = `hashed_${input.password}`;

    // Create user record with fisherman role
    const userResult = await db.insert(usersTable)
      .values({
        full_name: input.full_name,
        email: input.email,
        phone_number: input.phone_number,
        password_hash: password_hash,
        role: 'fisherman'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create associated fisherman profile
    await db.insert(fishermenProfilesTable)
      .values({
        user_id: user.id,
        catch_location: input.catch_location
      })
      .execute();

    return user;
  } catch (error) {
    console.error('Fisherman registration failed:', error);
    throw error;
  }
}
