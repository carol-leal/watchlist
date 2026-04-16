import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const playlistRouter = createTRPCRouter({
  getUserPlaylists: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.playlist.findMany({
      where: {
        users: {
          some: { userId: ctx.session.user.id },
        },
      },
      select: { id: true, name: true, slug: true, description: true },
      orderBy: { name: "asc" },
    });
  }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUnique({
        where: { slug: input.slug },
        include: {
          movies: {
            include: {
              addedBy: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          users: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });

      if (!playlist) return null;

      // Verify the user is a member
      const isMember = playlist.users.some(
        (u) => u.userId === ctx.session.user.id,
      );
      if (!isMember) return null;

      return playlist;
    }),

  updateMovieStatus: protectedProcedure
    .input(
      z.object({
        movieId: z.string(),
        status: z.enum(["PENDING", "WATCHING", "WATCHED", "DROPPED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.movie.update({
        where: { id: input.movieId },
        data: { status: input.status },
      });
    }),

  deleteMovie: protectedProcedure
    .input(z.object({ movieId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.movie.delete({
        where: { id: input.movieId },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseSlug = slugify(input.name) || "list";
      let slug = baseSlug;
      let suffix = 0;

      while (await ctx.db.playlist.findUnique({ where: { slug } })) {
        suffix++;
        slug = `${baseSlug}-${suffix}`;
      }

      return ctx.db.playlist.create({
        data: {
          name: input.name,
          slug,
          description: input.description ?? null,
          createdById: ctx.session.user.id,
          users: {
            create: { userId: ctx.session.user.id },
          },
        },
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
