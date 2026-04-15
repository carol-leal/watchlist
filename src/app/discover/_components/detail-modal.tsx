"use client";

import { Modal, Button, Chip, toast } from "@heroui/react";
import { ClockIcon, PlayIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { api } from "~/trpc/react";
import { type TmdbSearchResult, type TmdbGenreMap } from "~/types";

interface DetailModalProps {
  item: TmdbSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  genreMap: TmdbGenreMap;
  selectedPlaylistId: string;
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
  selectedPlaylistId,
}: DetailModalProps) {
  const utils = api.useUtils();

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

  const isAdding = addMovie.isPending ?? addSeries.isPending;

  const handleAdd = (
    status: "PENDING" | "WATCHING" | "WATCHED" | "DROPPED",
  ) => {
    if (!selectedPlaylistId) {
      toast.warning("Please select a list first");
      return;
    }

    const payload = {
      playlistId: selectedPlaylistId,
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
          <Modal.Dialog>
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
                      <span>{Math.round(item.voteAverage * 10)}</span>
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
              <div className="flex w-full flex-wrap items-center gap-2">
                {STATUS_BUTTONS.map(
                  ({ status, label, icon: Icon, variant }) => (
                    <Button
                      key={status}
                      variant={variant}
                      size="sm"
                      isPending={isAdding}
                      onPress={() => handleAdd(status)}
                    >
                      <Icon size={16} />
                      {label}
                    </Button>
                  ),
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={onClose}
                  className="ml-auto"
                >
                  Close
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
