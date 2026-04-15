"use client";

import { useState } from "react";
import { type Key } from "@heroui/react";
import {
  Modal,
  Button,
  Chip,
  Label,
  ListBox,
  Select,
  toast,
} from "@heroui/react";
import { ClockIcon, PlayIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { api } from "~/trpc/react";
import { type TmdbSearchResult, type TmdbGenreMap } from "~/types";

interface DetailModalProps {
  item: TmdbSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  genreMap: TmdbGenreMap;
}

const STATUS_BUTTONS = [
  {
    status: "PENDING" as const,
    label: "Add to pending",
    icon: ClockIcon,
    variant: "outline" as const,
  },
  {
    status: "WATCHING" as const,
    label: "Add to watching",
    icon: PlayIcon,
    variant: "primary" as const,
  },
  {
    status: "WATCHED" as const,
    label: "Add to watched",
    icon: CheckIcon,
    variant: "secondary" as const,
  },
  {
    status: "DROPPED" as const,
    label: "Dropped",
    icon: XIcon,
    variant: "danger" as const,
  },
];

export default function DetailModal({
  item,
  isOpen,
  onClose,
  genreMap,
}: DetailModalProps) {
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Key[]>([]);
  const utils = api.useUtils();
  const { data: playlists } = api.playlist.getUserPlaylists.useQuery();

  const addMovie = api.playlist.addMovie.useMutation({
    onSuccess: () => {
      toast.success("Movie added to list!");
      void utils.playlist.getUserPlaylists.invalidate();
      onClose();
    },
    onError: (err: { message: string }) => {
      toast.danger(err.message);
    },
  });

  const addSeries = api.playlist.addSeries.useMutation({
    onSuccess: () => {
      toast.success("Series added to list!");
      void utils.playlist.getUserPlaylists.invalidate();
      onClose();
    },
    onError: (err: { message: string }) => {
      toast.danger(err.message);
    },
  });

  if (!item) return null;

  const tags = item.genreIds
    .map((id) => genreMap[id])
    .filter(Boolean) as string[];

  const isAdding = addMovie.isPending || addSeries.isPending;

  const handleAdd = (
    status: "PENDING" | "WATCHING" | "WATCHED" | "DROPPED",
  ) => {
    if (selectedPlaylistIds.length === 0) {
      toast.warning("Please select at least one list");
      return;
    }

    for (const playlistId of selectedPlaylistIds) {
      const payload = {
        playlistId: String(playlistId),
        title: item.title,
        description: item.overview,
        image: item.posterPath,
        releaseDate: item.releaseDate,
        tmdbScore: item.voteAverage,
        tags,
        status,
      };

      if (item.mediaType === "movie") {
        addMovie.mutate(payload);
      } else {
        addSeries.mutate(payload);
      }
    }
  };

  const year = item.releaseDate
    ? new Date(item.releaseDate).getFullYear()
    : null;
  const formattedDate = item.releaseDate
    ? new Date(item.releaseDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="sm:max-w-4xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{item.title}</Modal.Heading>
              <div className="flex items-center gap-2 text-sm text-muted">
                {year && <span>{year}</span>}
                {formattedDate && (
                  <>
                    <span>•</span>
                    <span>{formattedDate}</span>
                  </>
                )}
                {item.voteAverage != null && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-warning">★</span>
                      <span>{item.voteAverage.toFixed(1)}</span>
                      <span className="text-xs text-muted">TMDB score</span>
                    </span>
                  </>
                )}
              </div>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-6 sm:flex-row">
                {/* Poster */}
                <div className="relative aspect-2/3 w-48 shrink-0 self-center overflow-hidden rounded-lg bg-surface sm:self-start">
                  {item.posterPath ? (
                    <Image
                      src={item.posterPath}
                      alt={item.title}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-4">
                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Chip key={tag} variant="secondary" size="sm">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}

                  {/* Overview */}
                  {item.overview && (
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {item.overview}
                    </p>
                  )}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="flex w-full flex-col gap-3">
                {/* Playlist selector */}
                {playlists && playlists.length > 0 && (
                  <Select
                    placeholder="Select lists"
                    selectionMode="multiple"
                    value={selectedPlaylistIds}
                    onChange={(value) => {
                      if (Array.isArray(value)) {
                        setSelectedPlaylistIds(value);
                      }
                    }}
                    className="w-full sm:w-72"
                  >
                    <Label>Add to lists</Label>
                    <Select.Trigger className="border border-separator">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox selectionMode="multiple">
                        {playlists.map((p) => (
                          <ListBox.Item
                            key={p.id}
                            id={p.id}
                            textValue={p.name}
                          >
                            {p.name}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}

                {/* Status buttons in 2x2 grid */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                  {STATUS_BUTTONS.map(
                    ({ status, label, icon: Icon, variant }) => (
                      <Button
                        key={status}
                        variant={variant}
                        size="sm"
                        isPending={isAdding}
                        isDisabled={selectedPlaylistIds.length === 0}
                        onPress={() => handleAdd(status)}
                      >
                        <Icon size={16} />
                        {label}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
