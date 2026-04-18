import { type RouterOutputs, type RouterInputs } from "~/trpc/react";

// TMDB
export type TmdbSearchResult =
  RouterOutputs["tmdb"]["search"]["results"][number];
export type TmdbSearchResponse = RouterOutputs["tmdb"]["search"];
export type TmdbGenreMap = RouterOutputs["tmdb"]["getGenres"];

// Playlists
export type Playlist = RouterOutputs["playlist"]["getUserPlaylists"][number];
export type UserPlaylists = RouterOutputs["playlist"]["getUserPlaylists"];
export type CreatePlaylistInput = RouterInputs["playlist"]["create"];
export type AddMovieInput = RouterInputs["playlist"]["addMovie"];
export type AddSeriesInput = RouterInputs["playlist"]["addSeries"];

// List detail
export type PlaylistDetail = NonNullable<
  RouterOutputs["playlist"]["getBySlug"]
>;
export type PlaylistMovie = PlaylistDetail["movies"][number];
export type PlaylistSeries = PlaylistDetail["series"][number];
export type PlaylistItem =
  | (PlaylistMovie & { kind: "movie" })
  | (PlaylistSeries & { kind: "series" });

// Helper to tag items with their kind
export function mergePlaylistItems(
  movies: PlaylistMovie[],
  series: PlaylistSeries[],
): PlaylistItem[] {
  return [
    ...movies.map((m): PlaylistItem => ({ ...m, kind: "movie" })),
    ...series.map((s): PlaylistItem => ({ ...s, kind: "series" })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export type { RouterOutputs, RouterInputs };
