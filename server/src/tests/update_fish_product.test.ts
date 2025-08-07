
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, fishProductsTable } from '../db/schema';
import { type UpdateFishProductInput } from '../schema';
import { updateFishProduct } from '../handlers/update_fish_product';
import { eq } from 'drizzle-orm';

describe('updateFishProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let fishermanId: number;
  let productId: number;

  beforeEach(async () => {
    // Create a fisherman user
    const fishermanResult = await db.insert(usersTable)
      .values({
        full_name: 'John Fisher',
        email: 'john@example.com',
        phone_number: '+1234567890',
        password_hash: 'hashed_password',
        role: 'fisherman'
      })
      .returning()
      .execute();

    fishermanId = fishermanResult[0].id;

    // Create a fish product
    const productResult = await db.insert(fishProductsTable)
      .values({
        fisherman_id: fishermanId,
        name: 'Original Salmon',
        description: 'Original description',
        price_per_kg: '25.50',
        stock_kg: '100.00',
        image_url: 'original-image.jpg',
        is_active: true
      })
      .returning()
      .execute();

    productId = productResult[0].id;
  });

  it('should update all product fields', async () => {
    const updateInput: UpdateFishProductInput = {
      id: productId,
      name: 'Updated Salmon',
      description: 'Updated description',
      price_per_kg: 30.75,
      stock_kg: 85.5,
      image_url: 'updated-image.jpg',
      is_active: false
    };

    const result = await updateFishProduct(updateInput);

    expect(result.id).toBe(productId);
    expect(result.name).toBe('Updated Salmon');
    expect(result.description).toBe('Updated description');
    expect(result.price_per_kg).toBe(30.75);
    expect(result.stock_kg).toBe(85.5);
    expect(result.image_url).toBe('updated-image.jpg');
    expect(result.is_active).toBe(false);
    expect(result.fisherman_id).toBe(fishermanId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateFishProductInput = {
      id: productId,
      name: 'Partially Updated Salmon',
      price_per_kg: 35.00
    };

    const result = await updateFishProduct(updateInput);

    expect(result.name).toBe('Partially Updated Salmon');
    expect(result.price_per_kg).toBe(35.00);
    // These should remain unchanged
    expect(result.description).toBe('Original description');
    expect(result.stock_kg).toBe(100.00);
    expect(result.image_url).toBe('original-image.jpg');
    expect(result.is_active).toBe(true);
  });

  it('should handle nullable fields correctly', async () => {
    const updateInput: UpdateFishProductInput = {
      id: productId,
      description: null,
      image_url: null
    };

    const result = await updateFishProduct(updateInput);

    expect(result.description).toBe(null);
    expect(result.image_url).toBe(null);
  });

  it('should update the database record', async () => {
    const updateInput: UpdateFishProductInput = {
      id: productId,
      name: 'Database Test Salmon',
      price_per_kg: 22.25
    };

    await updateFishProduct(updateInput);

    const products = await db.select()
      .from(fishProductsTable)
      .where(eq(fishProductsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Database Test Salmon');
    expect(parseFloat(products[0].price_per_kg)).toBe(22.25);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateFishProductInput = {
      id: 999999,
      name: 'Non-existent Product'
    };

    expect(updateFishProduct(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle numeric conversions correctly', async () => {
    const updateInput: UpdateFishProductInput = {
      id: productId,
      price_per_kg: 45.99,
      stock_kg: 123.45
    };

    const result = await updateFishProduct(updateInput);

    expect(typeof result.price_per_kg).toBe('number');
    expect(typeof result.stock_kg).toBe('number');
    expect(result.price_per_kg).toBe(45.99);
    expect(result.stock_kg).toBe(123.45);
  });

  it('should update timestamp automatically', async () => {
    const beforeUpdate = new Date();
    
    const updateInput: UpdateFishProductInput = {
      id: productId,
      name: 'Timestamp Test'
    };

    const result = await updateFishProduct(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });
});
