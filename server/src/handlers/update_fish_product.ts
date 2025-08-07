
import { db } from '../db';
import { fishProductsTable } from '../db/schema';
import { type UpdateFishProductInput, type FishProduct } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFishProduct = async (input: UpdateFishProductInput): Promise<FishProduct> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.price_per_kg !== undefined) {
      updateData.price_per_kg = input.price_per_kg.toString();
    }
    if (input.stock_kg !== undefined) {
      updateData.stock_kg = input.stock_kg.toString();
    }
    if (input.image_url !== undefined) {
      updateData.image_url = input.image_url;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the fish product
    const result = await db.update(fishProductsTable)
      .set(updateData)
      .where(eq(fishProductsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Fish product not found');
    }

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price_per_kg: parseFloat(product.price_per_kg),
      stock_kg: parseFloat(product.stock_kg)
    };
  } catch (error) {
    console.error('Fish product update failed:', error);
    throw error;
  }
};
