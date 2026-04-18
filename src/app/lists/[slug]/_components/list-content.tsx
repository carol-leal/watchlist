"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, Tooltip, toast } from "@heroui/react";
import {
  PencilSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { api } from "~/trpc/react";
import { type PlaylistItem, mergePlaylistItems } from "~/types";
import { useUserPreferences } from "~/app/_components/user-preferences";
import ListStats from "./list-stats";
import MovieCard from "./movie-card";
import ListSearchBar, { type SortOption } from "./list-search-bar";
import ShareModal from "./share-modal";
import EditListModal from "./edit-list-modal";

interface ListContentProps {
  slug: string;
}

export default function ListContent({ slug }: ListContentProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sort, setSort] = useState<SortOption>("added");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { preferences } = useUserPreferences();
  const router = useRouter();

  const utils = api.useUtils();

  const { data: playlist, isLoading } = api.playlist.getBySlug.useQuery(
    { slug },
    { refetchOnWindowFocus: false },
  );

  const invalidate = () => {
    void utils.playlist.getBySlug.invalidate({ slug });
    void utils.dashboard.getStats.invalidate();
    void utils.dashboard.getActivity.invalidate();
  };

  const deletePlaylist = api.playlist.deletePlaylist.useMutation({
    onSuccess: () => {
      toast.success("List deleted");
      void utils.playlist.getUserPlaylists.invalidate();
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getActivity.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const filtered = useMemo(() => {
    if (!playlist) return [] as PlaylistItem[];
    let items = mergePlaylistItems(playlist.movies, playlist.series);

    // Status filter
    if (statusFilter !== "ALL") {
      items = items.filter((m) => m.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ??
          m.description?.toLowerCase().includes(q) ??
          m.tags.some((t: string) => t.toLowerCase().includes(q)) ??
          m.addedBy.name.toLowerCase().includes(q),
      );
    }

    // Sort
    items = [...items].sort((a, b) => {
      switch (sort) {
        case "alpha":
          return a.title.localeCompare(b.title);
        case "release":
          return (
            new Date(b.releaseDate ?? 0).getTime() -
            new Date(a.releaseDate ?? 0).getTime()
          );
        case "rating":
          return (b.tmdbScore ?? 0) - (a.tmdbScore ?? 0);
        default: // "added"
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return items;
  }, [playlist, search, statusFilter, sort]);

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
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-sm text-muted">{playlist.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Tooltip>
            <Tooltip.Trigger>
              <Button
                variant="outline"
                isIconOnly
                size="sm"
                onPress={() => setEditOpen(true)}
              >
                <PencilSimpleIcon size={18} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Edit list</Tooltip.Content>
          </Tooltip>
          <Tooltip>
            <Tooltip.Trigger>
              <Button
                variant="outline"
                isIconOnly
                size="sm"
                onPress={() => setShareOpen(true)}
              >
                <ShareNetworkIcon size={18} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Share list</Tooltip.Content>
          </Tooltip>
          {confirmDelete ? (
            <div className="flex gap-1">
              <Button
                variant="danger"
                size="sm"
                isPending={deletePlaylist.isPending}
                onPress={() =>
                  deletePlaylist.mutate({ playlistId: playlist.id })
                }
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  variant="outline"
                  isIconOnly
                  size="sm"
                  className="text-danger"
                  onPress={() => setConfirmDelete(true)}
                >
                  <TrashIcon size={18} />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Delete list</Tooltip.Content>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Stats */}
      {preferences.showListStats && (
        <ListStats movies={[...playlist.movies, ...playlist.series]} />
      )}

      {/* Search & filters */}
      <ListSearchBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sort={sort}
        onSortChange={setSort}
        totalFiltered={filtered.length}
        totalAll={playlist.movies.length + playlist.series.length}
      />

      {/* Movie grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted">
            {playlist.movies.length + playlist.series.length === 0
              ? "No movies yet"
              : "No movies match your filters"}
          </p>
          <p className="mt-1 text-sm text-muted/70">
            {playlist.movies.length + playlist.series.length === 0
              ? "Head to Discover to add movies to this list"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <MovieCard
              key={item.id}
              movie={item}
              kind={item.kind}
              onDeleted={invalidate}
              onStatusChanged={invalidate}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      <EditListModal
        playlistId={playlist.id}
        currentName={playlist.name}
        currentDescription={playlist.description}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* Share modal */}
      <ShareModal
        playlistId={playlist.id}
        playlistName={playlist.name}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
