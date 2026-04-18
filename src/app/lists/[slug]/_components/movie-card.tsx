"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button, Chip, ListBox, Modal, Select, toast } from "@heroui/react";
import {
  ClockIcon,
  PlayIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
  UserIcon,
  StarIcon,
  TelevisionIcon,
} from "@phosphor-icons/react";
import { api } from "~/trpc/react";
import { type PlaylistItem } from "~/types";
import { useUserPreferences } from "~/app/_components/user-preferences";

interface MovieCardProps {
  movie: PlaylistItem;
  kind?: "movie" | "series";
  onDeleted: () => void;
  onStatusChanged: () => void;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    chipColor: "default" as const,
    chipClass: "text-warning",
    icon: ClockIcon,
    activeClass:
      "bg-warning text-warning-foreground border-warning disabled:opacity-100",
    inactiveClass: "text-warning border-separator hover:border-warning/50",
  },
  WATCHING: {
    label: "Watching",
    chipColor: "accent" as const,
    chipClass: "",
    icon: PlayIcon,
    activeClass:
      "bg-accent text-accent-foreground border-accent disabled:opacity-100",
    inactiveClass: "text-accent border-separator hover:border-accent/50",
  },
  WATCHED: {
    label: "Watched",
    chipColor: "default" as const,
    chipClass: "text-success",
    icon: CheckIcon,
    activeClass:
      "bg-success text-success-foreground border-success disabled:opacity-100",
    inactiveClass: "text-success border-separator hover:border-success/50",
  },
  DROPPED: {
    label: "Dropped",
    chipColor: "default" as const,
    chipClass: "",
    icon: XIcon,
    activeClass: "disabled:opacity-100",
    inactiveClass: "",
  },
} as const;

const STATUS_KEYS = ["WATCHED", "WATCHING", "PENDING", "DROPPED"] as const;

const STATUS_OPTIONS = [
  { key: "WATCHED", label: "Set as Watched" },
  { key: "WATCHING", label: "Set as Watching" },
  { key: "PENDING", label: "Set as Pending" },
  { key: "DROPPED", label: "Set as Dropped" },
] as const;

export default function MovieCard({
  movie,
  kind = "movie",
  onDeleted,
  onStatusChanged,
}: MovieCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { preferences } = useUserPreferences();

  const isSeries = movie.kind === "series";
  const seriesData = isSeries ? movie : null;

  const [season, setSeason] = useState(seriesData?.currentSeason ?? 1);
  const [episode, setEpisode] = useState(seriesData?.currentEpisode ?? 1);

  useEffect(() => {
    if (seriesData) {
      setSeason(seriesData.currentSeason);
      setEpisode(seriesData.currentEpisode);
    }
  }, [seriesData?.currentSeason, seriesData?.currentEpisode]);

  const tmdbId = movie.tmdbId ?? undefined;

  const { data: tvSeasons } = api.tmdb.getTvSeasons.useQuery(
    { tmdbId: tmdbId! },
    { enabled: isSeries && isModalOpen && !!tmdbId },
  );

  const currentSeasonData = tvSeasons?.find((s) => s.seasonNumber === season);

  const updateMovieStatus = api.playlist.updateMovieStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated!");
      onStatusChanged();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const updateSeriesStatus = api.playlist.updateSeriesStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated!");
      onStatusChanged();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const updateSeriesProgress = api.playlist.updateSeriesProgress.useMutation({
    onSuccess: () => {
      toast.success("Progress saved!");
      onStatusChanged();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const deleteMovie = api.playlist.deleteMovie.useMutation({
    onSuccess: () => {
      toast.success("Removed from list");
      onDeleted();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const deleteSeries = api.playlist.deleteSeries.useMutation({
    onSuccess: () => {
      toast.success("Removed from list");
      onDeleted();
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const isUpdating =
    updateMovieStatus.isPending || updateSeriesStatus.isPending;
  const isDeleting = deleteMovie.isPending || deleteSeries.isPending;

  const handleStatusChange = (
    status: "PENDING" | "WATCHING" | "WATCHED" | "DROPPED",
  ) => {
    if (kind === "series") {
      updateSeriesStatus.mutate({ seriesId: movie.id, status });
    } else {
      updateMovieStatus.mutate({ movieId: movie.id, status });
    }
  };

  const handleDelete = () => {
    if (kind === "series") {
      deleteSeries.mutate({ seriesId: movie.id });
    } else {
      deleteMovie.mutate({ movieId: movie.id });
    }
  };

  const handleSaveProgress = () => {
    updateSeriesProgress.mutate({
      seriesId: movie.id,
      currentSeason: season,
      currentEpisode: episode,
    });
  };

  const progressChanged =
    isSeries &&
    (season !== seriesData?.currentSeason ||
      episode !== seriesData?.currentEpisode);

  const currentStatus = STATUS_CONFIG[movie.status];

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
          <Chip
            color={currentStatus.chipColor}
            variant="secondary"
            size="sm"
            className={currentStatus.chipClass}
          >
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

          {/* Season/episode badge for series */}
          {isSeries && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <TelevisionIcon size={12} />
              <span>
                S{seriesData!.currentSeason} E{seriesData!.currentEpisode}
              </span>
            </div>
          )}

          {/* Tags */}
          {movie.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {movie.tags.slice(0, 3).map((tag: string) => (
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
            {/* Status selector */}
            {preferences.statusSelectMode === "dropdown" ? (
              <Select
                defaultSelectedKey={movie.status}
                onSelectionChange={(key) => {
                  if (key && key !== movie.status) {
                    handleStatusChange(
                      key as "PENDING" | "WATCHING" | "WATCHED" | "DROPPED",
                    );
                  }
                }}
                className="w-full"
              >
                <Select.Trigger className="w-full border border-separator text-[11px]">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {STATUS_OPTIONS.map(({ key, label }) => (
                      <ListBox.Item key={key} id={key} textValue={label}>
                        {label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {STATUS_KEYS.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  const isActive = movie.status === status;
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      className={`w-full gap-2 px-1 text-[10px] ${isActive ? config.activeClass : config.inactiveClass}`}
                      isDisabled={isActive || isUpdating}
                      onPress={() => handleStatusChange(status)}
                    >
                      <Icon size={12} />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1 text-[10px]"
                  isPending={isDeleting}
                  onPress={handleDelete}
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
                Delete
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
                  <Chip
                    color={currentStatus.chipColor}
                    variant="secondary"
                    size="sm"
                    className={currentStatus.chipClass}
                  >
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
                        {movie.tags.map((tag: string) => (
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
                  {/* Season / episode progress for series */}
                  {isSeries && (
                    <div className="flex flex-col gap-2 rounded-lg border border-separator p-3">
                      <p className="text-xs font-medium text-muted">
                        Progress
                      </p>
                      <div className="flex items-end gap-2">
                        {/* Season dropdown */}
                        <div className="flex-1">
                          <p className="mb-1 text-xs text-muted">Season</p>
                          <Select
                            value={String(season)}
                            onChange={(v) => {
                              setSeason(Number(v));
                              setEpisode(1);
                            }}
                          >
                            <Select.Trigger className="w-full border border-separator">
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                {tvSeasons
                                  ? tvSeasons.map((s) => (
                                      <ListBox.Item
                                        key={String(s.seasonNumber)}
                                        id={String(s.seasonNumber)}
                                        textValue={`Season ${s.seasonNumber}`}
                                      >
                                        Season {s.seasonNumber}
                                      </ListBox.Item>
                                    ))
                                  : Array.from(
                                      { length: season },
                                      (_, i) => i + 1,
                                    ).map((n) => (
                                      <ListBox.Item
                                        key={String(n)}
                                        id={String(n)}
                                        textValue={`Season ${n}`}
                                      >
                                        Season {n}
                                      </ListBox.Item>
                                    ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                        </div>

                        {/* Episode dropdown */}
                        <div className="flex-1">
                          <p className="mb-1 text-xs text-muted">Episode</p>
                          <Select
                            value={String(episode)}
                            onChange={(v) => setEpisode(Number(v))}
                          >
                            <Select.Trigger className="w-full border border-separator">
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                {Array.from(
                                  {
                                    length:
                                      currentSeasonData?.episodeCount ?? 50,
                                  },
                                  (_, i) => i + 1,
                                ).map((n) => (
                                  <ListBox.Item
                                    key={String(n)}
                                    id={String(n)}
                                    textValue={`Episode ${n}`}
                                  >
                                    Episode {n}
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          isDisabled={!progressChanged}
                          isPending={updateSeriesProgress.isPending}
                          onPress={handleSaveProgress}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Status selector */}
                  {preferences.statusSelectMode === "dropdown" ? (
                    <Select
                      defaultSelectedKey={movie.status}
                      onSelectionChange={(key) => {
                        if (key && key !== movie.status) {
                          handleStatusChange(
                            key as
                              | "PENDING"
                              | "WATCHING"
                              | "WATCHED"
                              | "DROPPED",
                          );
                        }
                      }}
                      className="w-full"
                    >
                      <Select.Trigger className="w-full border border-separator">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {STATUS_OPTIONS.map(({ key, label }) => (
                            <ListBox.Item key={key} id={key} textValue={label}>
                              {label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {STATUS_KEYS.map((status) => {
                        const config = STATUS_CONFIG[status];
                        const Icon = config.icon;
                        const isActive = movie.status === status;
                        return (
                          <Button
                            key={status}
                            size="sm"
                            variant="outline"
                            className={`w-full gap-2 px-1 text-[10px] ${isActive ? config.activeClass : config.inactiveClass}`}
                            isDisabled={isActive || isUpdating}
                            onPress={() => handleStatusChange(status)}
                          >
                            <Icon size={14} />
                            {config.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* Delete */}
                  {confirmDelete ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        isPending={isDeleting}
                        onPress={handleDelete}
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
                      Delete
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
