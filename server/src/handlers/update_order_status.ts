
import { db } from '../db';
import { ordersTable, fishProductsTable } from '../db/schema';
import { type UpdateOrderStatusInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateOrderStatus(input: UpdateOrderStatusInput): Promise<Order> {
  try {
    // First verify the order exists
    const existingOrders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.id))
      .execute();

    if (existingOrders.length === 0) {
      throw new Error(`Order with id ${input.id} not found`);
    }

    // Update the order status and updated_at timestamp
    const result = await db.update(ordersTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(ordersTable.id, input.id))
      .returning()
      .execute();

    const updatedOrder = result[0];
    
    // Convert numeric fields back to numbers
    return {
      ...updatedOrder,
      quantity_kg: parseFloat(updatedOrder.quantity_kg),
      total_price: parseFloat(updatedOrder.total_price)
    };
  } catch (error) {
    console.error('Order status update failed:', error);
    throw error;
  }
}
