
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, fishProductsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteFishProduct } from '../handlers/delete_fish_product';

describe('deleteFishProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testFishermanId: number;
  let testProductId: number;

  beforeEach(async () => {
    // Create test fisherman user
    const fishermanResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '+1234567890',
        password_hash: 'hashed_password',
        role: 'fisherman'
      })
      .returning()
      .execute();
    
    testFishermanId = fishermanResult[0].id;

    // Create test fish product
    const productResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: testFishermanId,
        name: 'Test Fish',
        description: 'Fresh test fish',
        price_per_kg: '15.99',
        stock_kg: '10.5',
        image_url: 'http://example.com/fish.jpg',
        is_active: true
      })
      .returning()
      .execute();
    
    testProductId = productResult[0].id;
  });

  it('should soft delete a fish product', async () => {
    const result = await deleteFishProduct(testProductId);

    // Verify returned product is marked as inactive
    expect(result.id).toEqual(testProductId);
    expect(result.fisherman_id).toEqual(testFishermanId);
    expect(result.name).toEqual('Test Fish');
    expect(result.description).toEqual('Fresh test fish');
    expect(result.price_per_kg).toEqual(15.99);
    expect(result.stock_kg).toEqual(10.5);
    expect(result.image_url).toEqual('http://example.com/fish.jpg');
    expect(result.is_active).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof result.price_per_kg).toBe('number');
    expect(typeof result.stock_kg).toBe('number');
  });

  it('should update product in database to inactive', async () => {
    await deleteFishProduct(testProductId);

    // Verify product is marked as inactive in database
    const products = await db.select()
      .from(fishProductsTable)
      .where(eq(fishProductsTable.id, testProductId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].is_active).toBe(false);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent product', async () => {
    const nonExistentId = 99999;
    
    await expect(deleteFishProduct(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should handle already deleted product', async () => {
    // First deletion
    await deleteFishProduct(testProductId);

    // Second deletion should still work (idempotent)
    const result = await deleteFishProduct(testProductId);
    
    expect(result.is_active).toBe(false);
    expect(result.id).toEqual(testProductId);
  });
});
