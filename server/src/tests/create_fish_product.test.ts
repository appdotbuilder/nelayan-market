
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fishProductsTable, usersTable } from '../db/schema';
import { type CreateFishProductInput } from '../schema';
import { createFishProduct } from '../handlers/create_fish_product';
import { eq } from 'drizzle-orm';

describe('createFishProduct', () => {
  let fishermanId: number;
  let buyerId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a fisherman user for testing
    const fishermenResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '1234567890',
        password_hash: 'hashedpassword',
        role: 'fisherman'
      })
      .returning()
      .execute();
    fishermanId = fishermenResult[0].id;

    // Create a buyer user for negative testing
    const buyerResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Buyer',
        email: 'buyer@test.com',
        phone_number: '0987654321',
        password_hash: 'hashedpassword',
        role: 'buyer'
      })
      .returning()
      .execute();
    buyerId = buyerResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateFishProductInput = {
    fisherman_id: 0, // Will be set in each test
    name: 'Fresh Salmon',
    description: 'Wild-caught Atlantic salmon',
    price_per_kg: 25.50,
    stock_kg: 15.5,
    image_url: 'https://example.com/salmon.jpg'
  };

  it('should create a fish product for valid fisherman', async () => {
    const input = { ...testInput, fisherman_id: fishermanId };
    const result = await createFishProduct(input);

    // Basic field validation
    expect(result.fisherman_id).toEqual(fishermanId);
    expect(result.name).toEqual('Fresh Salmon');
    expect(result.description).toEqual('Wild-caught Atlantic salmon');
    expect(result.price_per_kg).toEqual(25.50);
    expect(typeof result.price_per_kg).toBe('number');
    expect(result.stock_kg).toEqual(15.5);
    expect(typeof result.stock_kg).toBe('number');
    expect(result.image_url).toEqual('https://example.com/salmon.jpg');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save fish product to database', async () => {
    const input = { ...testInput, fisherman_id: fishermanId };
    const result = await createFishProduct(input);

    // Query using proper drizzle syntax
    const fishProducts = await db.select()
      .from(fishProductsTable)
      .where(eq(fishProductsTable.id, result.id))
      .execute();

    expect(fishProducts).toHaveLength(1);
    expect(fishProducts[0].fisherman_id).toEqual(fishermanId);
    expect(fishProducts[0].name).toEqual('Fresh Salmon');
    expect(fishProducts[0].description).toEqual('Wild-caught Atlantic salmon');
    expect(parseFloat(fishProducts[0].price_per_kg)).toEqual(25.50);
    expect(parseFloat(fishProducts[0].stock_kg)).toEqual(15.5);
    expect(fishProducts[0].image_url).toEqual('https://example.com/salmon.jpg');
    expect(fishProducts[0].is_active).toBe(true);
    expect(fishProducts[0].created_at).toBeInstanceOf(Date);
  });

  it('should create fish product with null optional fields', async () => {
    const inputWithNulls: CreateFishProductInput = {
      fisherman_id: fishermanId,
      name: 'Simple Fish',
      price_per_kg: 20.00,
      stock_kg: 10.0
      // description and image_url not provided
    };

    const result = await createFishProduct(inputWithNulls);

    expect(result.name).toEqual('Simple Fish');
    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.price_per_kg).toEqual(20.00);
    expect(result.stock_kg).toEqual(10.0);
  });

  it('should reject creation for non-fisherman user', async () => {
    const input = { ...testInput, fisherman_id: buyerId };
    
    await expect(createFishProduct(input)).rejects.toThrow(/invalid fisherman_id/i);
  });

  it('should reject creation for non-existent user', async () => {
    const input = { ...testInput, fisherman_id: 99999 };
    
    await expect(createFishProduct(input)).rejects.toThrow(/invalid fisherman_id/i);
  });
});
