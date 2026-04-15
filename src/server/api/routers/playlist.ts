import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const playlistRouter = createTRPCRouter({
  getUserPlaylists: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.playlist.findMany({
      where: {
        users: {
          some: { userId: ctx.session.user.id },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }),

  addMovie: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        title: z.string(),
        description: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
        releaseDate: z.string().nullable().optional(),
        tmdbScore: z.number().nullable().optional(),
        tags: z.array(z.string()).default([]),
        status: z.enum(["PENDING", "WATCHING", "WATCHED", "DROPPED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.movie.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          image: input.image ?? null,
          releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
          tmdbScore: input.tmdbScore ?? null,
          tags: input.tags,
          status: input.status,
          playlistId: input.playlistId,
          addedById: ctx.session.user.id,
          createdById: ctx.session.user.id,
        },
      });
    }),

  addSeries: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        title: z.string(),
        description: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
        releaseDate: z.string().nullable().optional(),
        tmdbScore: z.number().nullable().optional(),
        tags: z.array(z.string()).default([]),
        status: z.enum(["PENDING", "WATCHING", "WATCHED", "DROPPED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.series.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          image: input.image ?? null,
          releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
          tmdbScore: input.tmdbScore ?? null,
          tags: input.tags,
          status: input.status,
          playlistId: input.playlistId,
          addedById: ctx.session.user.id,
          createdById: ctx.session.user.id,
        },
      });
    }),
});
