
import { db } from '../db';
import { fishProductsTable } from '../db/schema';
import { type FishProduct } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getFishermanProducts(fishermanId: number): Promise<FishProduct[]> {
  try {
    const results = await db.select()
      .from(fishProductsTable)
      .where(eq(fishProductsTable.fisherman_id, fishermanId))
      .orderBy(desc(fishProductsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price_per_kg: parseFloat(product.price_per_kg),
      stock_kg: parseFloat(product.stock_kg)
    }));
  } catch (error) {
    console.error('Failed to get fisherman products:', error);
    throw error;
  }
}
