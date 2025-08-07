
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['fisherman', 'buyer']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  email: z.string().email(),
  phone_number: z.string(),
  password_hash: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Fisherman profile schema
export const fishermanProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  catch_location: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FishermanProfile = z.infer<typeof fishermanProfileSchema>;

// Fish product schema
export const fishProductSchema = z.object({
  id: z.number(),
  fisherman_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price_per_kg: z.number(),
  stock_kg: z.number(),
  image_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FishProduct = z.infer<typeof fishProductSchema>;

// Order status enum
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Payment method enum
export const paymentMethodSchema = z.enum(['cash_on_pickup']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  fish_product_id: z.number(),
  buyer_name: z.string(),
  buyer_phone: z.string(),
  buyer_address: z.string(),
  quantity_kg: z.number(),
  total_price: z.number(),
  payment_method: paymentMethodSchema,
  status: orderStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

// Input schemas for creating records
export const registerFishermanInputSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().min(1),
  password: z.string().min(6),
  catch_location: z.string().min(1)
});

export type RegisterFishermanInput = z.infer<typeof registerFishermanInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const createFishProductInputSchema = z.object({
  fisherman_id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price_per_kg: z.number().positive(),
  stock_kg: z.number().nonnegative(),
  image_url: z.string().nullable().optional()
});

export type CreateFishProductInput = z.infer<typeof createFishProductInputSchema>;

export const updateFishProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price_per_kg: z.number().positive().optional(),
  stock_kg: z.number().nonnegative().optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateFishProductInput = z.infer<typeof updateFishProductInputSchema>;

export const createOrderInputSchema = z.object({
  fish_product_id: z.number(),
  buyer_name: z.string().min(1),
  buyer_phone: z.string().min(1),
  buyer_address: z.string().min(1),
  quantity_kg: z.number().positive(),
  payment_method: paymentMethodSchema,
  notes: z.string().nullable().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.number(),
  status: orderStatusSchema
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

// Query input schemas
export const getFishProductsInputSchema = z.object({
  search: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  fisherman_id: z.number().optional(),
  is_active: z.boolean().optional()
});

export type GetFishProductsInput = z.infer<typeof getFishProductsInputSchema>;

export const getFishermanOrdersInputSchema = z.object({
  fisherman_id: z.number(),
  status: orderStatusSchema.optional()
});

export type GetFishermanOrdersInput = z.infer<typeof getFishermanOrdersInputSchema>;
