
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, fishProductsTable, usersTable } from '../db/schema';
import { type UpdateOrderStatusInput } from '../schema';
import { updateOrderStatus } from '../handlers/update_order_status';
import { eq } from 'drizzle-orm';

describe('updateOrderStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update order status successfully', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '1234567890',
        password_hash: 'hashedpassword',
        role: 'fisherman'
      })
      .returning()
      .execute();

    const fishProductResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: userResult[0].id,
        name: 'Test Fish',
        description: 'Fresh fish',
        price_per_kg: '25.50',
        stock_kg: '10.00',
        is_active: true
      })
      .returning()
      .execute();

    const orderResult = await db.insert(ordersTable)
      .values({
        fish_product_id: fishProductResult[0].id,
        buyer_name: 'Test Buyer',
        buyer_phone: '0987654321',
        buyer_address: '123 Test St',
        quantity_kg: '2.50',
        total_price: '63.75',
        payment_method: 'cash_on_pickup',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const input: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'confirmed'
    };

    const result = await updateOrderStatus(input);

    // Verify the response
    expect(result.id).toEqual(orderResult[0].id);
    expect(result.status).toEqual('confirmed');
    expect(result.fish_product_id).toEqual(fishProductResult[0].id);
    expect(result.buyer_name).toEqual('Test Buyer');
    expect(result.buyer_phone).toEqual('0987654321');
    expect(result.buyer_address).toEqual('123 Test St');
    expect(result.quantity_kg).toEqual(2.50);
    expect(result.total_price).toEqual(63.75);
    expect(result.payment_method).toEqual('cash_on_pickup');
    expect(result.notes).toEqual('Test order');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.quantity_kg).toBe('number');
    expect(typeof result.total_price).toBe('number');
  });

  it('should update the updated_at timestamp', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '1234567890',
        password_hash: 'hashedpassword',
        role: 'fisherman'
      })
      .returning()
      .execute();

    const fishProductResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: userResult[0].id,
        name: 'Test Fish',
        description: 'Fresh fish',
        price_per_kg: '25.50',
        stock_kg: '10.00',
        is_active: true
      })
      .returning()
      .execute();

    const orderResult = await db.insert(ordersTable)
      .values({
        fish_product_id: fishProductResult[0].id,
        buyer_name: 'Test Buyer',
        buyer_phone: '0987654321',
        buyer_address: '123 Test St',
        quantity_kg: '2.50',
        total_price: '63.75',
        payment_method: 'cash_on_pickup',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const originalUpdatedAt = orderResult[0].updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'completed'
    };

    const result = await updateOrderStatus(input);

    // Verify updated_at timestamp was changed
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should persist status update in database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '1234567890',
        password_hash: 'hashedpassword',
        role: 'fisherman'
      })
      .returning()
      .execute();

    const fishProductResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: userResult[0].id,
        name: 'Test Fish',
        description: 'Fresh fish',
        price_per_kg: '25.50',
        stock_kg: '10.00',
        is_active: true
      })
      .returning()
      .execute();

    const orderResult = await db.insert(ordersTable)
      .values({
        fish_product_id: fishProductResult[0].id,
        buyer_name: 'Test Buyer',
        buyer_phone: '0987654321',
        buyer_address: '123 Test St',
        quantity_kg: '2.50',
        total_price: '63.75',
        payment_method: 'cash_on_pickup',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const input: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'cancelled'
    };

    await updateOrderStatus(input);

    // Query database to verify the status was updated
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderResult[0].id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('cancelled');
    expect(orders[0].updated_at > orderResult[0].updated_at).toBe(true);
  });

  it('should handle all valid order statuses', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '1234567890',
        password_hash: 'hashedpassword',
        role: 'fisherman'
      })
      .returning()
      .execute();

    const fishProductResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: userResult[0].id,
        name: 'Test Fish',
        description: 'Fresh fish',
        price_per_kg: '25.50',
        stock_kg: '10.00',
        is_active: true
      })
      .returning()
      .execute();

    const orderResult = await db.insert(ordersTable)
      .values({
        fish_product_id: fishProductResult[0].id,
        buyer_name: 'Test Buyer',
        buyer_phone: '0987654321',
        buyer_address: '123 Test St',
        quantity_kg: '2.50',
        total_price: '63.75',
        payment_method: 'cash_on_pickup',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

    for (const status of statuses) {
      const input: UpdateOrderStatusInput = {
        id: orderResult[0].id,
        status: status
      };

      const result = await updateOrderStatus(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should throw error when order does not exist', async () => {
    const input: UpdateOrderStatusInput = {
      id: 99999,
      status: 'confirmed'
    };

    await expect(updateOrderStatus(input)).rejects.toThrow(/Order with id 99999 not found/i);
  });
});
