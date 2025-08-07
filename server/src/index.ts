
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { 
  registerFishermanInputSchema, 
  loginInputSchema, 
  createFishProductInputSchema,
  updateFishProductInputSchema,
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  getFishProductsInputSchema,
  getFishermanOrdersInputSchema
} from './schema';
import { registerFisherman } from './handlers/register_fisherman';
import { loginUser } from './handlers/login_user';
import { createFishProduct } from './handlers/create_fish_product';
import { getFishProducts } from './handlers/get_fish_products';
import { updateFishProduct } from './handlers/update_fish_product';
import { deleteFishProduct } from './handlers/delete_fish_product';
import { createOrder } from './handlers/create_order';
import { getFishermanOrders } from './handlers/get_fisherman_orders';
import { updateOrderStatus } from './handlers/update_order_status';
import { getFishermanProducts } from './handlers/get_fisherman_products';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication endpoints
  registerFisherman: publicProcedure
    .input(registerFishermanInputSchema)
    .mutation(({ input }) => registerFisherman(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Fish product management endpoints
  createFishProduct: publicProcedure
    .input(createFishProductInputSchema)
    .mutation(({ input }) => createFishProduct(input)),

  getFishProducts: publicProcedure
    .input(getFishProductsInputSchema.optional())
    .query(({ input }) => getFishProducts(input)),

  getFishermanProducts: publicProcedure
    .input(z.number())
    .query(({ input }) => getFishermanProducts(input)),

  updateFishProduct: publicProcedure
    .input(updateFishProductInputSchema)
    .mutation(({ input }) => updateFishProduct(input)),

  deleteFishProduct: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteFishProduct(input)),

  // Order management endpoints
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),

  getFishermanOrders: publicProcedure
    .input(getFishermanOrdersInputSchema)
    .query(({ input }) => getFishermanOrders(input)),

  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
