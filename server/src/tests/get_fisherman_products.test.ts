
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, fishProductsTable } from '../db/schema';
import { getFishermanProducts } from '../handlers/get_fisherman_products';

describe('getFishermanProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products for specific fisherman', async () => {
    // Create fisherman user
    const fishermanResult = await db.insert(usersTable)
      .values({
        full_name: 'Test Fisherman',
        email: 'fisherman@test.com',
        phone_number: '1234567890',
        password_hash: 'hashed_password',
        role: 'fisherman'
      })
      .returning()
      .execute();

    const fishermanId = fishermanResult[0].id;

    // Create products for the fisherman
    await db.insert(fishProductsTable)
      .values([
        {
          fisherman_id: fishermanId,
          name: 'Fresh Salmon',
          description: 'Wild caught salmon',
          price_per_kg: '25.99',
          stock_kg: '50.5',
          image_url: 'salmon.jpg',
          is_active: true
        },
        {
          fisherman_id: fishermanId,
          name: 'Ocean Tuna',
          description: 'Premium tuna',
          price_per_kg: '35.00',
          stock_kg: '30.0',
          image_url: null,
          is_active: false
        }
      ])
      .execute();

    const products = await getFishermanProducts(fishermanId);

    expect(products).toHaveLength(2);
    
    // Verify numeric conversions
    expect(typeof products[0].price_per_kg).toBe('number');
    expect(typeof products[0].stock_kg).toBe('number');
    expect(typeof products[1].price_per_kg).toBe('number');
    expect(typeof products[1].stock_kg).toBe('number');

    // Verify products are ordered by created_at descending (most recent first)
    expect(products[0].created_at >= products[1].created_at).toBe(true);

    // Verify product data
    const productNames = products.map(p => p.name);
    expect(productNames).toContain('Fresh Salmon');
    expect(productNames).toContain('Ocean Tuna');
  });

  it('should return empty array for fisherman with no products', async () => {
    // Create fisherman user
    const fishermanResult = await db.insert(usersTable)
      .values({
        full_name: 'No Products Fisherman',
        email: 'noproducts@test.com',
        phone_number: '0987654321',
        password_hash: 'hashed_password',
        role: 'fisherman'
      })
      .returning()
      .execute();

    const fishermanId = fishermanResult[0].id;
    const products = await getFishermanProducts(fishermanId);

    expect(products).toHaveLength(0);
    expect(Array.isArray(products)).toBe(true);
  });

  it('should not return products from other fishermen', async () => {
    // Create two fishermen
    const fishermen = await db.insert(usersTable)
      .values([
        {
          full_name: 'Fisherman One',
          email: 'fisherman1@test.com',
          phone_number: '1111111111',
          password_hash: 'hashed_password',
          role: 'fisherman'
        },
        {
          full_name: 'Fisherman Two',
          email: 'fisherman2@test.com',
          phone_number: '2222222222',
          password_hash: 'hashed_password',
          role: 'fisherman'
        }
      ])
      .returning()
      .execute();

    const fisherman1Id = fishermen[0].id;
    const fisherman2Id = fishermen[1].id;

    // Create products for both fishermen
    await db.insert(fishProductsTable)
      .values([
        {
          fisherman_id: fisherman1Id,
          name: 'Fisherman 1 Product',
          description: 'Product from fisherman 1',
          price_per_kg: '20.00',
          stock_kg: '10.0',
          is_active: true
        },
        {
          fisherman_id: fisherman2Id,
          name: 'Fisherman 2 Product',
          description: 'Product from fisherman 2',
          price_per_kg: '30.00',
          stock_kg: '15.0',
          is_active: true
        }
      ])
      .execute();

    const fisherman1Products = await getFishermanProducts(fisherman1Id);

    expect(fisherman1Products).toHaveLength(1);
    expect(fisherman1Products[0].name).toEqual('Fisherman 1 Product');
    expect(fisherman1Products[0].fisherman_id).toEqual(fisherman1Id);
  });

  it('should return products with proper field types', async () => {
    // Create fisherman user
    const fishermanResult = await db.insert(usersTable)
      .values({
        full_name: 'Type Test Fisherman',
        email: 'typetest@test.com',
        phone_number: '5555555555',
        password_hash: 'hashed_password',
        role: 'fisherman'
      })
      .returning()
      .execute();

    const fishermanId = fishermanResult[0].id;

    // Create product
    await db.insert(fishProductsTable)
      .values({
        fisherman_id: fishermanId,
        name: 'Type Test Fish',
        description: 'Fish for type testing',
        price_per_kg: '42.75',
        stock_kg: '100.25',
        image_url: 'test.jpg',
        is_active: true
      })
      .execute();

    const products = await getFishermanProducts(fishermanId);

    expect(products).toHaveLength(1);
    const product = products[0];

    // Verify all field types
    expect(typeof product.id).toBe('number');
    expect(typeof product.fisherman_id).toBe('number');
    expect(typeof product.name).toBe('string');
    expect(typeof product.description).toBe('string');
    expect(typeof product.price_per_kg).toBe('number');
    expect(typeof product.stock_kg).toBe('number');
    expect(typeof product.image_url).toBe('string');
    expect(typeof product.is_active).toBe('boolean');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);

    // Verify numeric precision
    expect(product.price_per_kg).toEqual(42.75);
    expect(product.stock_kg).toEqual(100.25);
  });
});
