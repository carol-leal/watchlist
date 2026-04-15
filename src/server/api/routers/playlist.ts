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
});
