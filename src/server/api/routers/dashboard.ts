import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const playlists = await ctx.db.playlist.findMany({
      where: {
        users: { some: { userId: ctx.session.user.id } },
      },
      include: {
        movies: { select: { status: true } },
        series: { select: { status: true } },
      },
    });

    const totalLists = playlists.length;
    let totalMovies = 0;
    let totalSeries = 0;
    let watched = 0;
    let watching = 0;
    let pending = 0;
    let dropped = 0;

    for (const p of playlists) {
      totalMovies += p.movies.length;
      totalSeries += p.series.length;
      for (const m of p.movies) {
        if (m.status === "WATCHED") watched++;
        else if (m.status === "WATCHING") watching++;
        else if (m.status === "PENDING") pending++;
        else if (m.status === "DROPPED") dropped++;
      }
      for (const s of p.series) {
        if (s.status === "WATCHED") watched++;
        else if (s.status === "WATCHING") watching++;
        else if (s.status === "PENDING") pending++;
        else if (s.status === "DROPPED") dropped++;
      }
    }

    return {
      totalLists,
      totalMovies,
      totalSeries,
      watched,
      watching,
      pending,
      dropped,
    };
  }),

  getActivity: protectedProcedure.query(async ({ ctx }) => {
    // Get playlist IDs the user belongs to
    const memberships = await ctx.db.playlistUser.findMany({
      where: { userId: ctx.session.user.id },
      select: { playlistId: true },
    });
    const playlistIds = memberships.map((m) => m.playlistId);

    const activities = await ctx.db.activityLog.findMany({
      where: { playlistId: { in: playlistIds } },
      include: {
        user: { select: { id: true, name: true, image: true } },
        playlist: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      movieTitle: a.movieTitle,
      metadata: a.metadata as Record<string, string> | null,
      user: a.user,
      playlist: a.playlist,
      createdAt: a.createdAt,
    }));
  }),

  getPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { discordUsername: true },
    });

    // Link any unlinked invitations matching this user's discord username
    if (user?.discordUsername) {
      await ctx.db.playlistInvitation.updateMany({
        where: {
          discordUsername: { equals: user.discordUsername, mode: "insensitive" },
          invitedUserId: null,
          status: "PENDING",
        },
        data: {
          invitedUserId: ctx.session.user.id,
        },
      });
    }

    return ctx.db.playlistInvitation.findMany({
      where: {
        invitedUserId: ctx.session.user.id,
        status: "PENDING",
      },
      include: {
        playlist: { select: { name: true, slug: true } },
        invitedBy: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  acceptInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.playlistInvitation.findUniqueOrThrow({
        where: { id: input.invitationId },
        include: { playlist: true },
      });

      if (invitation.invitedUserId !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }

      await ctx.db.playlistUser.create({
        data: {
          playlistId: invitation.playlistId,
          userId: ctx.session.user.id,
        },
      });

      await ctx.db.playlistInvitation.update({
        where: { id: input.invitationId },
        data: { status: "ACCEPTED" },
      });

      await ctx.db.activityLog.create({
        data: {
          type: "MEMBER_JOINED",
          playlistId: invitation.playlistId,
          userId: ctx.session.user.id,
          metadata: { memberName: ctx.session.user.name },
        },
      });

      return { playlistSlug: invitation.playlist.slug };
    }),

  declineInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.playlistInvitation.findUniqueOrThrow({
        where: { id: input.invitationId },
      });

      if (invitation.invitedUserId !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }

      await ctx.db.playlistInvitation.update({
        where: { id: input.invitationId },
        data: { status: "DECLINED" },
      });

      return true;
    }),
});
