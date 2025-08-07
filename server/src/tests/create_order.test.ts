
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, fishProductsTable, ordersTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let fisherUserId: number;
  let fishProductId: number;

  beforeEach(async () => {
    // Create a fisherman user
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

    fisherUserId = userResult[0].id;

    // Create a fish product
    const productResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: fisherUserId,
        name: 'Fresh Salmon',
        description: 'Wild caught salmon',
        price_per_kg: '25.50',
        stock_kg: '100.00',
        image_url: null,
        is_active: true
      })
      .returning()
      .execute();

    fishProductId = productResult[0].id;
  });

  const testInput: CreateOrderInput = {
    fish_product_id: 0, // Will be set in each test
    buyer_name: 'John Doe',
    buyer_phone: '9876543210',
    buyer_address: '123 Main St, City',
    quantity_kg: 5.0,
    payment_method: 'cash_on_pickup',
    notes: 'Please call before delivery'
  };

  it('should create an order successfully', async () => {
    const input = { ...testInput, fish_product_id: fishProductId };
    const result = await createOrder(input);

    expect(result.fish_product_id).toEqual(fishProductId);
    expect(result.buyer_name).toEqual('John Doe');
    expect(result.buyer_phone).toEqual('9876543210');
    expect(result.buyer_address).toEqual('123 Main St, City');
    expect(result.quantity_kg).toEqual(5.0);
    expect(result.total_price).toEqual(127.50); // 5.0 * 25.50
    expect(result.payment_method).toEqual('cash_on_pickup');
    expect(result.status).toEqual('pending');
    expect(result.notes).toEqual('Please call before delivery');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save order to database', async () => {
    const input = { ...testInput, fish_product_id: fishProductId };
    const result = await createOrder(input);

    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    const order = orders[0];
    expect(order.buyer_name).toEqual('John Doe');
    expect(parseFloat(order.quantity_kg)).toEqual(5.0);
    expect(parseFloat(order.total_price)).toEqual(127.50);
    expect(order.status).toEqual('pending');
  });

  it('should reduce product stock after order creation', async () => {
    const input = { ...testInput, fish_product_id: fishProductId };
    await createOrder(input);

    const products = await db.select()
      .from(fishProductsTable)
      .where(eq(fishProductsTable.id, fishProductId))
      .execute();

    expect(products).toHaveLength(1);
    expect(parseFloat(products[0].stock_kg)).toEqual(95.00); // 100.00 - 5.0
  });

  it('should throw error for non-existent fish product', async () => {
    const input = { ...testInput, fish_product_id: 99999 };
    
    expect(createOrder(input)).rejects.toThrow(/fish product not found/i);
  });

  it('should throw error for insufficient stock', async () => {
    const input = { ...testInput, fish_product_id: fishProductId, quantity_kg: 150.0 };
    
    expect(createOrder(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should throw error for inactive product', async () => {
    // Mark product as inactive
    await db.update(fishProductsTable)
      .set({ is_active: false })
      .where(eq(fishProductsTable.id, fishProductId))
      .execute();

    const input = { ...testInput, fish_product_id: fishProductId };
    
    expect(createOrder(input)).rejects.toThrow(/not active/i);
  });

  it('should handle order with null notes', async () => {
    const input = { ...testInput, fish_product_id: fishProductId, notes: undefined };
    const result = await createOrder(input);

    expect(result.notes).toBeNull();
  });

  it('should calculate total price correctly for different quantities', async () => {
    const input1 = { ...testInput, fish_product_id: fishProductId, quantity_kg: 2.5 };
    const result1 = await createOrder(input1);
    expect(result1.total_price).toEqual(63.75); // 2.5 * 25.50

    // Create another product for second test
    const productResult2 = await db.insert(fishProductsTable)
      .values({
        fisherman_id: fisherUserId,
        name: 'Fresh Tuna',
        description: 'Yellowfin tuna',
        price_per_kg: '40.00',
        stock_kg: '50.00',
        is_active: true
      })
      .returning()
      .execute();

    const input2 = { ...testInput, fish_product_id: productResult2[0].id, quantity_kg: 3.0 };
    const result2 = await createOrder(input2);
    expect(result2.total_price).toEqual(120.00); // 3.0 * 40.00
  });
});
