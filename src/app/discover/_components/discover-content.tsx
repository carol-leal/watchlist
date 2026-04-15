"use client";

import { useState } from "react";
import { Spinner } from "@heroui/react";
import { api } from "~/trpc/react";
import { type TmdbSearchResult } from "~/types";
import SearchBar from "./search-bar";
import ResultCard from "./result-card";
import DetailModal from "./detail-modal";
import PlaylistSelector from "./playlist-selector";

export default function DiscoverContent() {
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<TmdbSearchResult | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

  const {
    data: searchData,
    isLoading: isSearching,
    isFetching,
  } = api.tmdb.search.useQuery(
    { query },
    { enabled: query.length > 0, refetchOnWindowFocus: false },
  );

  const { data: genreMap } = api.tmdb.getGenres.useQuery(undefined, {
    staleTime: Infinity,
  });

  const { data: playlists } = api.playlist.getUserPlaylists.useQuery();

  const handleSearch = (q: string) => {
    setQuery(q);
  };

  const handleCardClick = (item: TmdbSearchResult) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-sm text-muted">
          Search for movies and TV shows to add to your watchlists.
        </p>
      </div>

      {/* Search + Playlist selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        {playlists && playlists.length > 0 && (
          <PlaylistSelector
            playlists={playlists}
            selectedPlaylistId={selectedPlaylistId}
            onSelectionChange={setSelectedPlaylistId}
          />
        )}
      </div>

      {/* Loading */}
      {(isSearching || isFetching) && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Results grid */}
      {searchData && !isSearching && !isFetching && (
        <>
          {searchData.results.length === 0 ? (
            <p className="py-12 text-center text-muted">
              No results found for &quot;{query}&quot;
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                {searchData.totalResults} result
                {searchData.totalResults !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {searchData.results.map((item) => (
                  <ResultCard
                    key={`${item.mediaType}-${item.id}`}
                    title={item.title}
                    posterPath={item.posterPath}
                    mediaType={item.mediaType}
                    onClick={() => handleCardClick(item)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Empty state */}
      {!query && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-muted">
            Search for a movie or TV show above
          </p>
          <p className="mt-1 text-sm text-muted/70">
            Results from TMDB will appear here
          </p>
        </div>
      )}

      {/* Detail modal */}
      <DetailModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        genreMap={genreMap ?? {}}
        selectedPlaylistId={selectedPlaylistId}
      />
    </div>
  );
}
