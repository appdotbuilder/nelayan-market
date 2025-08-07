
import { db } from '../db';
import { ordersTable, fishProductsTable } from '../db/schema';
import { type GetFishermanOrdersInput, type Order } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export async function getFishermanOrders(input: GetFishermanOrdersInput): Promise<Order[]> {
  try {
    // Build conditions array first
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by fisherman_id
    conditions.push(eq(fishProductsTable.fisherman_id, input.fisherman_id));
    
    // Add optional status filter
    if (input.status) {
      conditions.push(eq(ordersTable.status, input.status));
    }

    // Build the complete query with join and conditions
    const results = await db.select()
      .from(ordersTable)
      .innerJoin(fishProductsTable, eq(ordersTable.fish_product_id, fishProductsTable.id))
      .where(and(...conditions))
      .execute();

    // Transform joined results to Order objects with numeric conversions
    return results.map(result => ({
      ...result.orders,
      quantity_kg: parseFloat(result.orders.quantity_kg),
      total_price: parseFloat(result.orders.total_price)
    }));
  } catch (error) {
    console.error('Get fisherman orders failed:', error);
    throw error;
  }
}
