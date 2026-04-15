import { type RouterOutputs, type RouterInputs } from "~/trpc/react";

// TMDB
export type TmdbSearchResult =
  RouterOutputs["tmdb"]["search"]["results"][number];
export type TmdbSearchResponse = RouterOutputs["tmdb"]["search"];
export type TmdbGenreMap = RouterOutputs["tmdb"]["getGenres"];

// Playlists
export type Playlist = RouterOutputs["playlist"]["getUserPlaylists"][number];
export type UserPlaylists = RouterOutputs["playlist"]["getUserPlaylists"];
export type AddMovieInput = RouterInputs["playlist"]["addMovie"];
export type AddSeriesInput = RouterInputs["playlist"]["addSeries"];

export type { RouterOutputs, RouterInputs };
