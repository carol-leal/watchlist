"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Chip, Modal, toast } from "@heroui/react";
import {
  ClockIcon,
  PlayIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
  UserIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { api } from "~/trpc/react";
import { type PlaylistMovie } from "~/types";

interface MovieCardProps {
  movie: PlaylistMovie;
  onDeleted: () => void;
  onStatusChanged: () => void;
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "secondary" as const, icon: ClockIcon },
  WATCHING: { label: "Watching", color: "primary" as const, icon: PlayIcon },
  WATCHED: { label: "Watched", color: undefined, icon: CheckIcon },
  DROPPED: { label: "Dropped", color: "tertiary" as const, icon: XIcon },
} as const;

const STATUS_OPTIONS = ["PENDING", "WATCHING", "WATCHED", "DROPPED"] as const;

export default function MovieCard({
  movie,
  onDeleted,
  onStatusChanged,
}: MovieCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateStatus = api.playlist.updateMovieStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated!");
      onStatusChanged();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const deleteMovie = api.playlist.deleteMovie.useMutation({
    onSuccess: () => {
      toast.success("Movie removed from list");
      onDeleted();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const currentStatus = STATUS_CONFIG[movie.status];
  const StatusIcon = currentStatus.icon;

  const formattedDate = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-separator bg-surface transition-colors hover:border-accent/30"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Status badge */}
        <div className="absolute right-2 top-2 z-10">
          <Chip variant={currentStatus.color} size="sm">
            {currentStatus.label}
          </Chip>
        </div>

        {/* Poster */}
        <div className="relative aspect-2/3 w-full overflow-hidden bg-surface-secondary">
          {movie.image ? (
            <Image
              src={movie.image}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              No Image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          {/* Title & meta */}
          <div>
            <h3 className="line-clamp-1 text-sm font-bold leading-tight">
              {movie.title}
            </h3>
            {(formattedDate ?? movie.tmdbScore != null) && (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                {formattedDate && <span>{formattedDate}</span>}
                {formattedDate && movie.tmdbScore != null && <span>•</span>}
                {movie.tmdbScore != null && (
                  <span className="flex items-center gap-0.5">
                    <StarIcon
                      size={12}
                      weight="fill"
                      className="text-warning"
                    />
                    <span className="font-semibold">
                      {movie.tmdbScore.toFixed(1)}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {movie.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {movie.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-separator px-2 py-0.5 text-[10px] text-muted"
                >
                  {tag}
                </span>
              ))}
              {movie.tags.length > 3 && (
                <span className="rounded-full border border-separator px-2 py-0.5 text-[10px] text-muted">
                  +{movie.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Added by */}
          <div className="mt-auto flex items-center gap-1.5 border-t border-separator pt-2">
            {movie.addedBy.image ? (
              <Image
                src={movie.addedBy.image}
                alt={movie.addedBy.name}
                width={16}
                height={16}
                className="rounded-full"
              />
            ) : (
              <UserIcon size={14} className="text-muted" />
            )}
            <span className="text-[11px] text-muted">
              Added by{" "}
              <span className="text-foreground">{movie.addedBy.name}</span>
            </span>
          </div>

          {/* Quick actions */}
          <div
            className="flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status buttons */}
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((status) => {
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;
                const isActive = movie.status === status;
                return (
                  <Button
                    key={status}
                    size="sm"
                    variant={isActive ? config.color : "outline"}
                    className="flex-1 gap-0.5 px-1 text-[10px]"
                    isDisabled={isActive || updateStatus.isPending}
                    onPress={() =>
                      updateStatus.mutate({ movieId: movie.id, status })
                    }
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{config.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1 text-[10px]"
                  isPending={deleteMovie.isPending}
                  onPress={() => deleteMovie.mutate({ movieId: movie.id })}
                >
                  Confirm Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px]"
                  onPress={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-[10px] text-danger"
                onPress={() => setConfirmDelete(true)}
              >
                <TrashIcon size={12} />
                Delete Movie
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            if (!open) setIsModalOpen(false);
          }}
        >
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="sm:max-w-3xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{movie.title}</Modal.Heading>
                <div className="flex items-center gap-2 text-sm text-muted">
                  {formattedDate && <span>{formattedDate}</span>}
                  {movie.tmdbScore != null && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <StarIcon
                          size={14}
                          weight="fill"
                          className="text-warning"
                        />
                        <span>{movie.tmdbScore.toFixed(1)}</span>
                        <span className="text-xs text-muted">TMDB score</span>
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <Chip variant={currentStatus.color} size="sm">
                    {currentStatus.label}
                  </Chip>
                </div>
              </Modal.Header>
              <Modal.Body>
                <div className="flex flex-col gap-6 sm:flex-row">
                  {/* Poster */}
                  <div className="relative aspect-2/3 w-48 shrink-0 self-center overflow-hidden rounded-lg bg-surface-secondary sm:self-start">
                    {movie.image ? (
                      <Image
                        src={movie.image}
                        alt={movie.title}
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
                    {movie.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {movie.tags.map((tag) => (
                          <Chip key={tag} variant="secondary" size="sm">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    {movie.description && (
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {movie.description}
                      </p>
                    )}

                    {/* Added by */}
                    <div className="flex items-center gap-1.5">
                      {movie.addedBy.image ? (
                        <Image
                          src={movie.addedBy.image}
                          alt={movie.addedBy.name}
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      ) : (
                        <UserIcon size={14} className="text-muted" />
                      )}
                      <span className="text-xs text-muted">
                        Added by{" "}
                        <span className="text-foreground">
                          {movie.addedBy.name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <div className="flex w-full flex-col gap-2">
                  {/* Status buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {STATUS_OPTIONS.map((status) => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const isActive = movie.status === status;
                      return (
                        <Button
                          key={status}
                          size="sm"
                          variant={isActive ? config.color : "outline"}
                          className="gap-1"
                          isDisabled={isActive || updateStatus.isPending}
                          onPress={() =>
                            updateStatus.mutate({ movieId: movie.id, status })
                          }
                        >
                          <Icon size={14} />
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Delete */}
                  {confirmDelete ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        isPending={deleteMovie.isPending}
                        onPress={() =>
                          deleteMovie.mutate({ movieId: movie.id })
                        }
                      >
                        Confirm Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-danger"
                      onPress={() => setConfirmDelete(true)}
                    >
                      <TrashIcon size={14} />
                      Delete Movie
                    </Button>
                  )}
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
