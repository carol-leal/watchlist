"use client";

import { useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import { api } from "~/trpc/react";
import ListStats from "./list-stats";
import MovieCard from "./movie-card";
import ListSearchBar from "./list-search-bar";

interface ListContentProps {
  slug: string;
}

export default function ListContent({ slug }: ListContentProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const utils = api.useUtils();

  const { data: playlist, isLoading } = api.playlist.getBySlug.useQuery(
    { slug },
    { refetchOnWindowFocus: false },
  );

  const invalidate = () => {
    void utils.playlist.getBySlug.invalidate({ slug });
  };

  const filtered = useMemo(() => {
    if (!playlist) return [];
    let movies = playlist.movies;

    // Status filter
    if (statusFilter !== "ALL") {
      movies = movies.filter((m) => m.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      movies = movies.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)) ||
          m.addedBy.name.toLowerCase().includes(q),
      );
    }

    return movies;
  }, [playlist, search, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted">List not found</p>
        <p className="mt-1 text-sm text-muted/70">
          This list doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{playlist.name}</h1>
        {playlist.description && (
          <p className="text-sm text-muted">{playlist.description}</p>
        )}
      </div>

      {/* Stats */}
      <ListStats movies={playlist.movies} />

      {/* Search & filters */}
      <ListSearchBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalFiltered={filtered.length}
        totalAll={playlist.movies.length}
      />

      {/* Movie grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted">
            {playlist.movies.length === 0
              ? "No movies yet"
              : "No movies match your filters"}
          </p>
          <p className="mt-1 text-sm text-muted/70">
            {playlist.movies.length === 0
              ? "Head to Discover to add movies to this list"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onDeleted={invalidate}
              onStatusChanged={invalidate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
