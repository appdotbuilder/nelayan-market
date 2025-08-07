
import { db } from '../db';
import { fishProductsTable, usersTable } from '../db/schema';
import { type GetFishProductsInput, type FishProduct } from '../schema';
import { eq, and, gte, lte, ilike, SQL } from 'drizzle-orm';

export async function getFishProducts(input?: GetFishProductsInput): Promise<FishProduct[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input) {
      // Search by product name (case-insensitive)
      if (input.search) {
        conditions.push(ilike(fishProductsTable.name, `%${input.search}%`));
      }

      // Filter by minimum price - need to cast to numeric for proper comparison
      if (input.min_price !== undefined) {
        conditions.push(gte(fishProductsTable.price_per_kg, input.min_price.toString()));
      }

      // Filter by maximum price - need to cast to numeric for proper comparison
      if (input.max_price !== undefined) {
        conditions.push(lte(fishProductsTable.price_per_kg, input.max_price.toString()));
      }

      // Filter by specific fisherman
      if (input.fisherman_id !== undefined) {
        conditions.push(eq(fishProductsTable.fisherman_id, input.fisherman_id));
      }

      // Filter by active status
      if (input.is_active !== undefined) {
        conditions.push(eq(fishProductsTable.is_active, input.is_active));
      }
    }

    // Build the complete query with join and where clause
    const baseQuery = db.select({
      id: fishProductsTable.id,
      fisherman_id: fishProductsTable.fisherman_id,
      name: fishProductsTable.name,
      description: fishProductsTable.description,
      price_per_kg: fishProductsTable.price_per_kg,
      stock_kg: fishProductsTable.stock_kg,
      image_url: fishProductsTable.image_url,
      is_active: fishProductsTable.is_active,
      created_at: fishProductsTable.created_at,
      updated_at: fishProductsTable.updated_at,
    })
    .from(fishProductsTable)
    .innerJoin(usersTable, eq(fishProductsTable.fisherman_id, usersTable.id));

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await baseQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      ...result,
      price_per_kg: parseFloat(result.price_per_kg),
      stock_kg: parseFloat(result.stock_kg)
    }));
  } catch (error) {
    console.error('Get fish products failed:', error);
    throw error;
  }
}
