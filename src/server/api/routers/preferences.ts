import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const preferencesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.userPreferences.findUnique({
      where: { userId: ctx.session.user.id },
    });

    return (
      prefs ?? {
        showListStats: true,
        statusSelectMode: "dropdown" as const,
        defaultPlaylistId: null,
      }
    );
  }),

  update: protectedProcedure
    .input(
      z.object({
        showListStats: z.boolean().optional(),
        statusSelectMode: z.enum(["dropdown", "buttons"]).optional(),
        defaultPlaylistId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
        update: input,
      });
    }),
});
