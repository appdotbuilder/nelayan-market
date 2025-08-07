
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['fisherman', 'buyer']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'completed', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash_on_pickup']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone_number: text('phone_number').notNull(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Fisherman profiles table
export const fishermenProfilesTable = pgTable('fishermen_profiles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  catch_location: text('catch_location').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Fish products table
export const fishProductsTable = pgTable('fish_products', {
  id: serial('id').primaryKey(),
  fisherman_id: integer('fisherman_id').references(() => usersTable.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price_per_kg: numeric('price_per_kg', { precision: 10, scale: 2 }).notNull(),
  stock_kg: numeric('stock_kg', { precision: 8, scale: 2 }).notNull(),
  image_url: text('image_url'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  fish_product_id: integer('fish_product_id').references(() => fishProductsTable.id).notNull(),
  buyer_name: text('buyer_name').notNull(),
  buyer_phone: text('buyer_phone').notNull(),
  buyer_address: text('buyer_address').notNull(),
  quantity_kg: numeric('quantity_kg', { precision: 8, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  fishermanProfile: one(fishermenProfilesTable, {
    fields: [usersTable.id],
    references: [fishermenProfilesTable.user_id],
  }),
  fishProducts: many(fishProductsTable),
}));

export const fishermenProfilesRelations = relations(fishermenProfilesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [fishermenProfilesTable.user_id],
    references: [usersTable.id],
  }),
}));

export const fishProductsRelations = relations(fishProductsTable, ({ one, many }) => ({
  fisherman: one(usersTable, {
    fields: [fishProductsTable.fisherman_id],
    references: [usersTable.id],
  }),
  orders: many(ordersTable),
}));

export const ordersRelations = relations(ordersTable, ({ one }) => ({
  fishProduct: one(fishProductsTable, {
    fields: [ordersTable.fish_product_id],
    references: [fishProductsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type FishermanProfile = typeof fishermenProfilesTable.$inferSelect;
export type NewFishermanProfile = typeof fishermenProfilesTable.$inferInsert;

export type FishProduct = typeof fishProductsTable.$inferSelect;
export type NewFishProduct = typeof fishProductsTable.$inferInsert;

export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  fishermenProfiles: fishermenProfilesTable,
  fishProducts: fishProductsTable,
  orders: ordersTable,
};
