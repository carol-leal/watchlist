import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const tmdbResultSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  overview: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  first_air_date: z.string().nullable().optional(),
  vote_average: z.number().nullable().optional(),
  genre_ids: z.array(z.number()).optional(),
  media_type: z.string().optional(),
});

const tmdbGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${env.TMDB_BEARER}`,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const tmdbRouter = createTRPCRouter({
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1), page: z.number().default(1) }))
    .query(async ({ input }) => {
      const data = await tmdbFetch<{
        results: z.infer<typeof tmdbResultSchema>[];
        total_pages: number;
        total_results: number;
      }>("/search/multi", {
        query: input.query,
        page: String(input.page),
        include_adult: "false",
      });

      // Filter to only movies and tv shows
      const results = data.results
        .filter((r) => r.media_type === "movie" || r.media_type === "tv")
        .map((r) => ({
          id: r.id,
          title: r.title ?? r.name ?? "Unknown",
          overview: r.overview ?? null,
          posterPath: r.poster_path
            ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
            : null,
          releaseDate: r.release_date ?? r.first_air_date ?? null,
          voteAverage: r.vote_average ?? null,
          genreIds: r.genre_ids ?? [],
          mediaType: r.media_type as "movie" | "tv",
        }));

      return {
        results,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    }),

  getGenres: protectedProcedure.query(async () => {
    const [movieGenres, tvGenres] = await Promise.all([
      tmdbFetch<{ genres: z.infer<typeof tmdbGenreSchema>[] }>(
        "/genre/movie/list",
      ),
      tmdbFetch<{ genres: z.infer<typeof tmdbGenreSchema>[] }>(
        "/genre/tv/list",
      ),
    ]);

    const genreMap = new Map<number, string>();
    for (const g of [...movieGenres.genres, ...tvGenres.genres]) {
      genreMap.set(g.id, g.name);
    }
    return Object.fromEntries(genreMap);
  }),
});
