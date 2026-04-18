import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  requestMovieOnJellyseerr,
  requestSeriesOnJellyseerr,
} from "~/server/jellyseerr";

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
          series: {
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
      const movie = await ctx.db.movie.findUniqueOrThrow({
        where: { id: input.movieId },
        select: {
          title: true,
          status: true,
          playlistId: true,
          tmdbId: true,
          playlist: { select: { jellyseerrEnabled: true } },
        },
      });
      const updated = await ctx.db.movie.update({
        where: { id: input.movieId },
        data: { status: input.status },
      });
      await ctx.db.activityLog.create({
        data: {
          type: "STATUS_CHANGED",
          playlistId: movie.playlistId,
          userId: ctx.session.user.id,
          movieTitle: movie.title,
          metadata: { oldStatus: movie.status, newStatus: input.status },
        },
      });
      if (input.status === "WATCHING" && movie.tmdbId && movie.playlist.jellyseerrEnabled) {
        await requestMovieOnJellyseerr(movie.tmdbId);
      }
      return updated;
    }),

  deleteMovie: protectedProcedure
    .input(z.object({ movieId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const movie = await ctx.db.movie.findUniqueOrThrow({
        where: { id: input.movieId },
        select: { title: true, playlistId: true },
      });
      const deleted = await ctx.db.movie.delete({
        where: { id: input.movieId },
      });
      await ctx.db.activityLog.create({
        data: {
          type: "MOVIE_DELETED",
          playlistId: movie.playlistId,
          userId: ctx.session.user.id,
          movieTitle: movie.title,
        },
      });
      return deleted;
    }),

  updateSeriesStatus: protectedProcedure
    .input(
      z.object({
        seriesId: z.string(),
        status: z.enum(["PENDING", "WATCHING", "WATCHED", "DROPPED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const series = await ctx.db.series.findUniqueOrThrow({
        where: { id: input.seriesId },
        select: {
          title: true,
          status: true,
          playlistId: true,
          tmdbId: true,
          currentSeason: true,
          playlist: { select: { jellyseerrEnabled: true } },
        },
      });
      const updated = await ctx.db.series.update({
        where: { id: input.seriesId },
        data: { status: input.status },
      });
      await ctx.db.activityLog.create({
        data: {
          type: "STATUS_CHANGED",
          playlistId: series.playlistId,
          userId: ctx.session.user.id,
          movieTitle: series.title,
          metadata: { oldStatus: series.status, newStatus: input.status },
        },
      });
      if (input.status === "WATCHING" && series.tmdbId && series.playlist.jellyseerrEnabled) {
        await requestSeriesOnJellyseerr(series.tmdbId, series.currentSeason);
      }
      return updated;
    }),

  updateSeriesProgress: protectedProcedure
    .input(
      z.object({
        seriesId: z.string(),
        currentSeason: z.number().int().min(1),
        currentEpisode: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.series.update({
        where: { id: input.seriesId },
        data: {
          currentSeason: input.currentSeason,
          currentEpisode: input.currentEpisode,
        },
      });
    }),

  deleteSeries: protectedProcedure
    .input(z.object({ seriesId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const series = await ctx.db.series.findUniqueOrThrow({
        where: { id: input.seriesId },
        select: { title: true, playlistId: true },
      });
      const deleted = await ctx.db.series.delete({
        where: { id: input.seriesId },
      });
      await ctx.db.activityLog.create({
        data: {
          type: "SERIES_DELETED",
          playlistId: series.playlistId,
          userId: ctx.session.user.id,
          movieTitle: series.title,
        },
      });
      return deleted;
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

  updatePlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true },
      });

      if (playlist?.createdById !== ctx.session.user.id) {
        throw new Error("Not authorized to edit this list");
      }

      return ctx.db.playlist.update({
        where: { id: input.playlistId },
        data: {
          name: input.name,
          description: input.description ?? null,
        },
      });
    }),

  deletePlaylist: protectedProcedure
    .input(z.object({ playlistId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is the creator
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true },
      });

      if (playlist?.createdById !== ctx.session.user.id) {
        throw new Error("Not authorized to delete this list");
      }

      return ctx.db.playlist.delete({
        where: { id: input.playlistId },
      });
    }),

  addMovie: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        tmdbId: z.number().optional(),
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
      const playlist = await ctx.db.playlist.findUniqueOrThrow({
        where: { id: input.playlistId },
        select: { jellyseerrEnabled: true },
      });

      if (input.tmdbId) {
        const existing = await ctx.db.movie.findFirst({
          where: {
            playlistId: input.playlistId,
            tmdbId: input.tmdbId,
          },
        });
        if (existing) {
          throw new Error("This movie is already in this list");
        }
      }

      const movie = await ctx.db.movie.create({
        data: {
          title: input.title,
          tmdbId: input.tmdbId ?? null,
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
      await ctx.db.activityLog.create({
        data: {
          type: "MOVIE_ADDED",
          playlistId: input.playlistId,
          userId: ctx.session.user.id,
          movieTitle: input.title,
          metadata: { status: input.status },
        },
      });
      if (input.status === "WATCHING" && input.tmdbId && playlist.jellyseerrEnabled) {
        await requestMovieOnJellyseerr(input.tmdbId);
      }
      return movie;
    }),

  addSeries: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        tmdbId: z.number().optional(),
        title: z.string(),
        description: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
        releaseDate: z.string().nullable().optional(),
        tmdbScore: z.number().nullable().optional(),
        tags: z.array(z.string()).default([]),
        status: z.enum(["PENDING", "WATCHING", "WATCHED", "DROPPED"]),
        currentSeason: z.number().int().min(1).default(1),
        currentEpisode: z.number().int().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUniqueOrThrow({
        where: { id: input.playlistId },
        select: { jellyseerrEnabled: true },
      });

      if (input.tmdbId) {
        const existing = await ctx.db.series.findFirst({
          where: {
            playlistId: input.playlistId,
            tmdbId: input.tmdbId,
          },
        });
        if (existing) {
          throw new Error("This series is already in this list");
        }
      }

      const series = await ctx.db.series.create({
        data: {
          title: input.title,
          tmdbId: input.tmdbId ?? null,
          description: input.description ?? null,
          image: input.image ?? null,
          releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
          tmdbScore: input.tmdbScore ?? null,
          tags: input.tags,
          status: input.status,
          currentSeason: input.currentSeason,
          currentEpisode: input.currentEpisode,
          playlistId: input.playlistId,
          addedById: ctx.session.user.id,
          createdById: ctx.session.user.id,
        },
      });
      await ctx.db.activityLog.create({
        data: {
          type: "SERIES_ADDED",
          playlistId: input.playlistId,
          userId: ctx.session.user.id,
          movieTitle: input.title,
          metadata: { status: input.status },
        },
      });
      if (input.status === "WATCHING" && input.tmdbId && playlist.jellyseerrEnabled) {
        await requestSeriesOnJellyseerr(input.tmdbId, input.currentSeason);
      }
      return series;
    }),
});
