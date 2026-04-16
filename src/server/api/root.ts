import { playlistRouter } from "~/server/api/routers/playlist";
import { postRouter } from "~/server/api/routers/post";
import { preferencesRouter } from "~/server/api/routers/preferences";
import { shareRouter } from "~/server/api/routers/share";
import { tmdbRouter } from "~/server/api/routers/tmdb";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  playlist: playlistRouter,
  preferences: preferencesRouter,
  share: shareRouter,
  tmdb: tmdbRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
