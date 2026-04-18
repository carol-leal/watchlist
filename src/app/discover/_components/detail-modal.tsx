"use client";

import { useState, useEffect } from "react";
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
import { useUserPreferences } from "~/app/_components/user-preferences";

interface DetailModalProps {
  item: TmdbSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  genreMap: TmdbGenreMap;
}

const STATUS_OPTIONS = [
  {
    key: "WATCHED",
    label: "Set as Watched",
    icon: CheckIcon,
    colorClass: "text-success",
  },
  {
    key: "WATCHING",
    label: "Set as Watching",
    icon: PlayIcon,
    colorClass: "text-accent",
  },
  {
    key: "PENDING",
    label: "Set as Pending",
    icon: ClockIcon,
    colorClass: "text-warning",
  },
  { key: "DROPPED", label: "Set as Dropped", icon: XIcon, colorClass: "" },
] as const;

export default function DetailModal({
  item,
  isOpen,
  onClose,
  genreMap,
}: DetailModalProps) {
  const { preferences } = useUserPreferences();
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Key[]>(
    preferences.defaultPlaylistId ? [preferences.defaultPlaylistId] : [],
  );
  const [selectedStatus, setSelectedStatus] = useState<
    "PENDING" | "WATCHING" | "WATCHED" | "DROPPED"
  >("WATCHED");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const utils = api.useUtils();
  const { data: playlists } = api.playlist.getUserPlaylists.useQuery();

  const isTv = item?.mediaType === "tv";

  const { data: tvSeasons } = api.tmdb.getTvSeasons.useQuery(
    { tmdbId: item?.id ?? 0 },
    { enabled: isTv && isOpen && !!item?.id },
  );

  const currentSeasonData = tvSeasons?.find((s) => s.seasonNumber === season);

  // Reset selections when modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaylistIds(
        preferences.defaultPlaylistId ? [preferences.defaultPlaylistId] : [],
      );
      setSelectedStatus("WATCHED");
      setSeason(1);
      setEpisode(1);
    }
  }, [isOpen, preferences.defaultPlaylistId]);

  const addMovie = api.playlist.addMovie.useMutation({
    onSuccess: () => {
      toast.success("Movie added to list!");
      void utils.playlist.getUserPlaylists.invalidate();
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getActivity.invalidate();
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
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getActivity.invalidate();
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
        tmdbId: item.id,
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
        addSeries.mutate({ ...payload, currentSeason: season, currentEpisode: episode });
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
                {/* Season / episode for TV shows */}
                {isTv && (
                  <div className="flex gap-2">
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
                              : [1].map((n) => (
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
                              { length: currentSeasonData?.episodeCount ?? 50 },
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
                  </div>
                )}

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
                          <ListBox.Item key={p.id} id={p.id} textValue={p.name}>
                            {p.name}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}

                {/* Status selector + Add button */}
                {preferences.statusSelectMode === "dropdown" ? (
                  <div className="flex gap-2">
                    <Select
                      defaultSelectedKey="WATCHED"
                      onSelectionChange={(key) => {
                        if (key) {
                          setSelectedStatus(key as typeof selectedStatus);
                        }
                      }}
                      className="flex-1"
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
                    <Button
                      variant="primary"
                      isPending={isAdding}
                      isDisabled={selectedPlaylistIds.length === 0}
                      onPress={() => handleAdd(selectedStatus)}
                    >
                      Add to List
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                    {STATUS_OPTIONS.map(
                      ({ key, label, icon: Icon, colorClass }) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          className={colorClass}
                          isPending={isAdding}
                          isDisabled={selectedPlaylistIds.length === 0}
                          onPress={() => handleAdd(key)}
                        >
                          <Icon size={16} />
                          {label}
                        </Button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
