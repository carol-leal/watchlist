import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const shareRouter = createTRPCRouter({
  getPlaylistMembers: protectedProcedure
    .input(z.object({ playlistId: z.string() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: {
          createdById: true,
          users: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          invitations: {
            include: {
              invitedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!playlist) throw new Error("Playlist not found");

      const members = playlist.users.map((pu) => ({
        id: pu.id,
        userId: pu.user.id,
        name: pu.user.name,
        image: pu.user.image,
        isOwner: pu.user.id === playlist.createdById,
      }));

      const invitations = playlist.invitations.map((inv) => ({
        id: inv.id,
        discordUsername: inv.discordUsername,
        invitedBy: inv.invitedBy.name,
        createdAt: inv.createdAt,
      }));

      return { members, invitations };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        discordUsername: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const username = input.discordUsername.trim();

      // Check the user is a member of this playlist
      const membership = await ctx.db.playlistUser.findUnique({
        where: {
          playlistId_userId: {
            playlistId: input.playlistId,
            userId: ctx.session.user.id,
          },
        },
      });
      if (!membership) throw new Error("You are not a member of this list");

      // Look for a user with this name (case-insensitive)
      const targetUser = await ctx.db.user.findFirst({
        where: {
          name: { equals: username, mode: "insensitive" },
        },
      });

      if (targetUser) {
        // Check if already a member
        const existing = await ctx.db.playlistUser.findUnique({
          where: {
            playlistId_userId: {
              playlistId: input.playlistId,
              userId: targetUser.id,
            },
          },
        });
        if (existing) throw new Error("User is already a member of this list");

        // Add directly
        await ctx.db.playlistUser.create({
          data: {
            playlistId: input.playlistId,
            userId: targetUser.id,
          },
        });

        // Remove any pending invitation for this username
        await ctx.db.playlistInvitation.deleteMany({
          where: {
            playlistId: input.playlistId,
            discordUsername: { equals: username, mode: "insensitive" },
          },
        });

        return { added: true, username };
      }

      // User not found — create pending invitation
      const existingInvite = await ctx.db.playlistInvitation.findUnique({
        where: {
          playlistId_discordUsername: {
            playlistId: input.playlistId,
            discordUsername: username,
          },
        },
      });
      if (existingInvite) throw new Error("Invitation already pending");

      await ctx.db.playlistInvitation.create({
        data: {
          playlistId: input.playlistId,
          discordUsername: username,
          invitedById: ctx.session.user.id,
        },
      });

      return { added: false, username };
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify caller is the owner
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true },
      });
      if (playlist?.createdById !== ctx.session.user.id) {
        throw new Error("Only the owner can remove members");
      }
      if (input.userId === ctx.session.user.id) {
        throw new Error("Cannot remove yourself");
      }

      return ctx.db.playlistUser.delete({
        where: {
          playlistId_userId: {
            playlistId: input.playlistId,
            userId: input.userId,
          },
        },
      });
    }),

  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.playlistInvitation.delete({
        where: { id: input.invitationId },
      });
    }),
});
