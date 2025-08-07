
import { db } from '../db';
import { fishProductsTable, usersTable } from '../db/schema';
import { type CreateFishProductInput, type FishProduct } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createFishProduct = async (input: CreateFishProductInput): Promise<FishProduct> => {
  try {
    // Validate that the fisherman_id belongs to a user with 'fisherman' role
    const fisherman = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, input.fisherman_id),
        eq(usersTable.role, 'fisherman')
      ))
      .execute();

    if (fisherman.length === 0) {
      throw new Error('Invalid fisherman_id: User not found or not a fisherman');
    }

    // Insert fish product record
    const result = await db.insert(fishProductsTable)
      .values({
        fisherman_id: input.fisherman_id,
        name: input.name,
        description: input.description || null,
        price_per_kg: input.price_per_kg.toString(), // Convert number to string for numeric column
        stock_kg: input.stock_kg.toString(), // Convert number to string for numeric column
        image_url: input.image_url || null,
        is_active: true // Default value
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const fishProduct = result[0];
    return {
      ...fishProduct,
      price_per_kg: parseFloat(fishProduct.price_per_kg), // Convert string back to number
      stock_kg: parseFloat(fishProduct.stock_kg) // Convert string back to number
    };
  } catch (error) {
    console.error('Fish product creation failed:', error);
    throw error;
  }
};
