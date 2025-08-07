
import { db } from '../db';
import { fishProductsTable } from '../db/schema';
import { type FishProduct } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteFishProduct(productId: number): Promise<FishProduct> {
  try {
    // Soft delete by setting is_active to false
    const result = await db.update(fishProductsTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(fishProductsTable.id, productId))
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
    console.error('Fish product deletion failed:', error);
    throw error;
  }
}
