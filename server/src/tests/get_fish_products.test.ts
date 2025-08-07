
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, fishProductsTable } from '../db/schema';
import { type GetFishProductsInput } from '../schema';
import { getFishProducts } from '../handlers/get_fish_products';

describe('getFishProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let fishermanId: number;
  let fisherman2Id: number;

  beforeEach(async () => {
    // Create test fishermen first
    const fishermen = await db.insert(usersTable)
      .values([
        {
          full_name: 'John Fisher',
          email: 'john@example.com',
          phone_number: '1234567890',
          password_hash: 'hashed_password',
          role: 'fisherman'
        },
        {
          full_name: 'Jane Fisher',
          email: 'jane@example.com',
          phone_number: '0987654321',
          password_hash: 'hashed_password',
          role: 'fisherman'
        }
      ])
      .returning()
      .execute();

    fishermanId = fishermen[0].id;
    fisherman2Id = fishermen[1].id;

    // Create test fish products
    await db.insert(fishProductsTable)
      .values([
        {
          fisherman_id: fishermanId,
          name: 'Fresh Salmon',
          description: 'Wild caught salmon',
          price_per_kg: '25.50',
          stock_kg: '10.00',
          image_url: 'salmon.jpg',
          is_active: true
        },
        {
          fisherman_id: fishermanId,
          name: 'Ocean Tuna',
          description: 'Premium tuna',
          price_per_kg: '35.00',
          stock_kg: '5.50',
          image_url: 'tuna.jpg',
          is_active: true
        },
        {
          fisherman_id: fisherman2Id,
          name: 'River Trout',
          description: 'Fresh water trout',
          price_per_kg: '20.00',
          stock_kg: '8.00',
          image_url: null,
          is_active: false
        }
      ])
      .execute();
  });

  it('should return all fish products when no filter provided', async () => {
    const result = await getFishProducts();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Fresh Salmon');
    expect(result[0].price_per_kg).toEqual(25.50);
    expect(typeof result[0].price_per_kg).toBe('number');
    expect(result[0].stock_kg).toEqual(10.00);
    expect(typeof result[0].stock_kg).toBe('number');
    expect(result[0].fisherman_id).toEqual(fishermanId);
  });

  it('should return empty array when no products exist', async () => {
    // Clear all products
    await db.delete(fishProductsTable).execute();

    const result = await getFishProducts();
    expect(result).toHaveLength(0);
  });

  it('should filter by search term (case-insensitive)', async () => {
    const input: GetFishProductsInput = {
      search: 'salmon'
    };

    const result = await getFishProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Fresh Salmon');
    expect(result[0].price_per_kg).toEqual(25.50);
  });

  it('should filter by minimum price', async () => {
    const input: GetFishProductsInput = {
      min_price: 30.00
    };

    const result = await getFishProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Ocean Tuna');
    expect(result[0].price_per_kg).toEqual(35.00);
  });

  it('should filter by maximum price', async () => {
    const input: GetFishProductsInput = {
      max_price: 25.50
    };

    const result = await getFishProducts(input);

    expect(result).toHaveLength(2);
    expect(result.some(p => p.name === 'Fresh Salmon')).toBe(true);
    expect(result.some(p => p.name === 'River Trout')).toBe(true);
    expect(result.some(p => p.name === 'Ocean Tuna')).toBe(false);
  });

  it('should filter by price range', async () => {
    const input: GetFishProductsInput = {
      min_price: 20.00,
      max_price: 30.00
    };

    const result = await getFishProducts(input);

    expect(result).toHaveLength(2);
    expect(result.some(p => p.name === 'Fresh Salmon')).toBe(true);
    expect(result.some(p => p.name === 'River Trout')).toBe(true);
    expect(result.some(p => p.name === 'Ocean Tuna')).toBe(false);
  });

  it('should filter by fisherman_id', async () => {
    const input: GetFishProductsInput = {
      fisherman_id: fisherman2Id
    };

    const result = await getFishProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('River Trout');
    expect(result[0].fisherman_id).toEqual(fisherman2Id);
  });

  it('should filter by is_active status', async () => {
    const input: GetFishProductsInput = {
      is_active: true
    };

    const result = await getFishProducts(input);

    expect(result).toHaveLength(2);
    expect(result.every(p => p.is_active === true)).toBe(true);
    expect(result.some(p => p.name === 'River Trout')).toBe(false);
  });

  it('should combine multiple filters', async () => {
    const input: GetFishProductsInput = {
      search: 'salmon',
      min_price: 20.00,
      fisherman_id: fishermanId,
      is_active: true
    };

    const result = await getFishProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Fresh Salmon');
    expect(result[0].price_per_kg).toEqual(25.50);
    expect(result[0].is_active).toBe(true);
  });

  it('should return empty array when filters match no products', async () => {
    const input: GetFishProductsInput = {
      search: 'nonexistent fish'
    };

    const result = await getFishProducts(input);
    expect(result).toHaveLength(0);
  });

  it('should handle null values correctly', async () => {
    const result = await getFishProducts();

    const trout = result.find(p => p.name === 'River Trout');
    expect(trout).toBeDefined();
    expect(trout!.image_url).toBeNull();
    expect(trout!.description).toEqual('Fresh water trout');
  });
});
