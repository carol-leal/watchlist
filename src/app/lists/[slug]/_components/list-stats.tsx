"use client";

import { useMemo } from "react";
import {
  FilmSlateIcon,
  ClockIcon,
  PlayIcon,
  CheckIcon,
  XIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { Label, ProgressBar } from "@heroui/react";
import { type PlaylistMovie } from "~/types";

interface ListStatsProps {
  movies: PlaylistMovie[];
}

const AVERAGE_MOVIE_MINUTES = 120;

export default function ListStats({ movies }: ListStatsProps) {
  const stats = useMemo(() => {
    const total = movies.length;
    const pending = movies.filter((m) => m.status === "PENDING").length;
    const watching = movies.filter((m) => m.status === "WATCHING").length;
    const watched = movies.filter((m) => m.status === "WATCHED").length;
    const dropped = movies.filter((m) => m.status === "DROPPED").length;

    const totalHours = Math.round((watched * AVERAGE_MOVIE_MINUTES) / 60);
    const progress = total > 0 ? Math.round((watched / total) * 100) : 0;

    return { total, pending, watching, watched, dropped, totalHours, progress };
  }, [movies]);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={<FilmSlateIcon size={20} />}
          label="Total Movies"
          value={stats.total}
        />
        <StatCard
          icon={<ClockIcon size={20} />}
          label="Pending"
          value={stats.pending}
          color="text-warning"
        />
        <StatCard
          icon={<PlayIcon size={20} />}
          label="Watching"
          value={stats.watching}
          color="text-accent"
        />
        <StatCard
          icon={<CheckIcon size={20} />}
          label="Watched"
          value={stats.watched}
          color="text-success"
        />
        <StatCard
          icon={<XIcon size={20} />}
          label="Dropped"
          value={stats.dropped}
        />
        <StatCard
          icon={<ChartBarIcon size={20} />}
          label="Hours Watched"
          value={`${stats.totalHours}h`}
        />
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-separator bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">List Progress</span>
          <span className="font-semibold text-accent">
            {stats.watched}/{stats.total} watched
          </span>
        </div>
        <ProgressBar
          aria-label="List progress"
          value={stats.progress}
          className="w-full"
          color="accent"
        >
          <ProgressBar.Output>{stats.progress}%</ProgressBar.Output>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-separator bg-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={`text-lg font-bold ${color ?? ""}`}>{value}</p>
      </div>
    </div>
  );
}
