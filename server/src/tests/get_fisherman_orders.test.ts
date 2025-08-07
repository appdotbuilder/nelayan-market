
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, fishProductsTable, ordersTable } from '../db/schema';
import { type GetFishermanOrdersInput } from '../schema';
import { getFishermanOrders } from '../handlers/get_fisherman_orders';

describe('getFishermanOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let fishermanUserId: number;
  let otherFishermanUserId: number;
  let fishProductId: number;
  let otherFishProductId: number;

  beforeEach(async () => {
    // Create fisherman user
    const fishermanResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '1234567890',
        password_hash: 'hashedpassword',
        role: 'fisherman'
      })
      .returning()
      .execute();
    fishermanUserId = fishermanResult[0].id;

    // Create another fisherman user
    const otherFishermanResult = await db.insert(usersTable)
      .values({
        full_name: 'Other Fisherman',
        email: 'other@test.com',
        phone_number: '0987654321',
        password_hash: 'hashedpassword',
        role: 'fisherman'
      })
      .returning()
      .execute();
    otherFishermanUserId = otherFishermanResult[0].id;

    // Create fish product for main fisherman
    const fishProductResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: fishermanUserId,
        name: 'Fresh Salmon',
        description: 'Wild caught salmon',
        price_per_kg: '25.99',
        stock_kg: '50.00'
      })
      .returning()
      .execute();
    fishProductId = fishProductResult[0].id;

    // Create fish product for other fisherman
    const otherFishProductResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: otherFishermanUserId,
        name: 'Fresh Tuna',
        description: 'Fresh tuna',
        price_per_kg: '30.00',
        stock_kg: '25.00'
      })
      .returning()
      .execute();
    otherFishProductId = otherFishProductResult[0].id;
  });

  it('should return orders for specific fisherman', async () => {
    // Create orders for the fisherman's product
    await db.insert(ordersTable)
      .values([
        {
          fish_product_id: fishProductId,
          buyer_name: 'John Buyer',
          buyer_phone: '555-1234',
          buyer_address: '123 Main St',
          quantity_kg: '5.00',
          total_price: '129.95',
          payment_method: 'cash_on_pickup',
          status: 'pending'
        },
        {
          fish_product_id: fishProductId,
          buyer_name: 'Jane Buyer',
          buyer_phone: '555-5678',
          buyer_address: '456 Oak Ave',
          quantity_kg: '3.50',
          total_price: '90.97',
          payment_method: 'cash_on_pickup',
          status: 'confirmed'
        }
      ])
      .execute();

    // Create order for other fisherman's product (should not be returned)
    await db.insert(ordersTable)
      .values({
        fish_product_id: otherFishProductId,
        buyer_name: 'Bob Buyer',
        buyer_phone: '555-9999',
        buyer_address: '789 Pine St',
        quantity_kg: '2.00',
        total_price: '60.00',
        payment_method: 'cash_on_pickup',
        status: 'pending'
      })
      .execute();

    const input: GetFishermanOrdersInput = {
      fisherman_id: fishermanUserId
    };

    const result = await getFishermanOrders(input);

    expect(result).toHaveLength(2);
    
    // Check that all orders belong to the correct fisherman's products
    result.forEach(order => {
      expect(order.fish_product_id).toEqual(fishProductId);
    });

    // Check numeric conversions
    expect(typeof result[0].quantity_kg).toBe('number');
    expect(typeof result[0].total_price).toBe('number');
    
    // Check specific values
    const pendingOrder = result.find(order => order.status === 'pending');
    const confirmedOrder = result.find(order => order.status === 'confirmed');
    
    expect(pendingOrder).toBeDefined();
    expect(pendingOrder!.buyer_name).toEqual('John Buyer');
    expect(pendingOrder!.quantity_kg).toEqual(5.00);
    expect(pendingOrder!.total_price).toEqual(129.95);
    
    expect(confirmedOrder).toBeDefined();
    expect(confirmedOrder!.buyer_name).toEqual('Jane Buyer');
    expect(confirmedOrder!.quantity_kg).toEqual(3.50);
    expect(confirmedOrder!.total_price).toEqual(90.97);
  });

  it('should filter orders by status', async () => {
    // Create orders with different statuses
    await db.insert(ordersTable)
      .values([
        {
          fish_product_id: fishProductId,
          buyer_name: 'John Buyer',
          buyer_phone: '555-1234',
          buyer_address: '123 Main St',
          quantity_kg: '5.00',
          total_price: '129.95',
          payment_method: 'cash_on_pickup',
          status: 'pending'
        },
        {
          fish_product_id: fishProductId,
          buyer_name: 'Jane Buyer',
          buyer_phone: '555-5678',
          buyer_address: '456 Oak Ave',
          quantity_kg: '3.50',
          total_price: '90.97',
          payment_method: 'cash_on_pickup',
          status: 'confirmed'
        },
        {
          fish_product_id: fishProductId,
          buyer_name: 'Bob Buyer',
          buyer_phone: '555-9999',
          buyer_address: '789 Pine St',
          quantity_kg: '2.00',
          total_price: '51.98',
          payment_method: 'cash_on_pickup',
          status: 'completed'
        }
      ])
      .execute();

    const input: GetFishermanOrdersInput = {
      fisherman_id: fishermanUserId,
      status: 'confirmed'
    };

    const result = await getFishermanOrders(input);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('confirmed');
    expect(result[0].buyer_name).toEqual('Jane Buyer');
    expect(result[0].quantity_kg).toEqual(3.50);
    expect(result[0].total_price).toEqual(90.97);
  });

  it('should return empty array when fisherman has no orders', async () => {
    const input: GetFishermanOrdersInput = {
      fisherman_id: fishermanUserId
    };

    const result = await getFishermanOrders(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when filtering by status with no matches', async () => {
    // Create orders with different status
    await db.insert(ordersTable)
      .values({
        fish_product_id: fishProductId,
        buyer_name: 'John Buyer',
        buyer_phone: '555-1234',
        buyer_address: '123 Main St',
        quantity_kg: '5.00',
        total_price: '129.95',
        payment_method: 'cash_on_pickup',
        status: 'pending'
      })
      .execute();

    const input: GetFishermanOrdersInput = {
      fisherman_id: fishermanUserId,
      status: 'completed'
    };

    const result = await getFishermanOrders(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
