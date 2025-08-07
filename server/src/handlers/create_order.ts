
import { db } from '../db';
import { fishProductsTable, ordersTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  try {
    // First, fetch the fish product to get price and check stock
    const products = await db.select()
      .from(fishProductsTable)
      .where(eq(fishProductsTable.id, input.fish_product_id))
      .execute();

    if (products.length === 0) {
      throw new Error('Fish product not found');
    }

    const product = products[0];
    
    // Check if product is active
    if (!product.is_active) {
      throw new Error('Fish product is not active');
    }

    // Convert numeric fields to numbers for calculations
    const pricePerKg = parseFloat(product.price_per_kg);
    const stockKg = parseFloat(product.stock_kg);
    const quantityKg = input.quantity_kg;

    // Check if sufficient stock is available
    if (stockKg < quantityKg) {
      throw new Error('Insufficient stock available');
    }

    // Calculate total price
    const totalPrice = quantityKg * pricePerKg;

    // Create the order
    const orderResult = await db.insert(ordersTable)
      .values({
        fish_product_id: input.fish_product_id,
        buyer_name: input.buyer_name,
        buyer_phone: input.buyer_phone,
        buyer_address: input.buyer_address,
        quantity_kg: quantityKg.toString(),
        total_price: totalPrice.toString(),
        payment_method: input.payment_method,
        status: 'pending',
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Update product stock
    const newStockKg = stockKg - quantityKg;
    await db.update(fishProductsTable)
      .set({
        stock_kg: newStockKg.toString(),
        updated_at: new Date()
      })
      .where(eq(fishProductsTable.id, input.fish_product_id))
      .execute();

    const order = orderResult[0];
    return {
      ...order,
      quantity_kg: parseFloat(order.quantity_kg),
      total_price: parseFloat(order.total_price)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}
