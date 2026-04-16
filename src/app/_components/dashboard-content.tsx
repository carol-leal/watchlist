"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FilmSlateIcon,
  TelevisionSimpleIcon,
  ListIcon,
  CheckIcon,
  PlayIcon,
  ClockIcon,
  XIcon,
  PlusCircleIcon,
  ArrowsClockwiseIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import { Button, Spinner } from "@heroui/react";
import { api } from "~/trpc/react";

const ACTIVITY_ICONS: Record<string, typeof PlusCircleIcon> = {
  MOVIE_ADDED: PlusCircleIcon,
  SERIES_ADDED: PlusCircleIcon,
  STATUS_CHANGED: ArrowsClockwiseIcon,
  MOVIE_DELETED: TrashIcon,
  MEMBER_JOINED: UserPlusIcon,
  MEMBER_REMOVED: UserMinusIcon,
};

const ACTIVITY_COLOR: Record<string, string> = {
  MOVIE_ADDED: "text-success",
  SERIES_ADDED: "text-success",
  STATUS_CHANGED: "text-accent",
  MOVIE_DELETED: "text-danger",
  MEMBER_JOINED: "text-success",
  MEMBER_REMOVED: "text-warning",
};

function formatActivityMessage(
  type: string,
  userName: string,
  movieTitle: string | null,
  metadata: Record<string, string> | null,
) {
  switch (type) {
    case "MOVIE_ADDED":
      return (
        <>
          <strong>{userName}</strong> added <strong>{movieTitle}</strong>
          {metadata?.status && (
            <>
              {" "}
              as{" "}
              <span className="font-semibold">
                {metadata.status.toLowerCase()}
              </span>
            </>
          )}
        </>
      );
    case "SERIES_ADDED":
      return (
        <>
          <strong>{userName}</strong> added series <strong>{movieTitle}</strong>
          {metadata?.status && (
            <>
              {" "}
              as{" "}
              <span className="font-semibold">
                {metadata.status.toLowerCase()}
              </span>
            </>
          )}
        </>
      );
    case "STATUS_CHANGED":
      return (
        <>
          <strong>{userName}</strong> changed <strong>{movieTitle}</strong> from{" "}
          <span className="text-muted">
            {metadata?.oldStatus?.toLowerCase()}
          </span>{" "}
          to{" "}
          <span className="font-semibold">
            {metadata?.newStatus?.toLowerCase()}
          </span>
        </>
      );
    case "MOVIE_DELETED":
      return (
        <>
          <strong>{userName}</strong> removed <strong>{movieTitle}</strong>
        </>
      );
    case "MEMBER_JOINED":
      return (
        <>
          <strong>{metadata?.memberName ?? userName}</strong> joined the list
        </>
      );
    case "MEMBER_REMOVED":
      return (
        <>
          <strong>{userName}</strong> removed{" "}
          <strong>{metadata?.memberName}</strong> from the list
        </>
      );
    default:
      return <strong>{userName}</strong>;
  }
}

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardContent() {
  const utils = api.useUtils();
  const { data: stats, isLoading: statsLoading } =
    api.dashboard.getStats.useQuery();
  const { data: activity, isLoading: activityLoading } =
    api.dashboard.getActivity.useQuery();
  const { data: invitations } = api.dashboard.getPendingInvitations.useQuery();

  const acceptInvitation = api.dashboard.acceptInvitation.useMutation({
    onSuccess: () => {
      void utils.dashboard.getPendingInvitations.invalidate();
      void utils.dashboard.getStats.invalidate();
      void utils.dashboard.getActivity.invalidate();
      void utils.playlist.getUserPlaylists.invalidate();
    },
  });

  const declineInvitation = api.dashboard.declineInvitation.useMutation({
    onSuccess: () => {
      void utils.dashboard.getPendingInvitations.invalidate();
    },
  });

  if (statsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Overview of all your watchlists
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            icon={<ListIcon size={20} />}
            label="Lists"
            value={stats.totalLists}
          />
          <StatCard
            icon={<FilmSlateIcon size={20} />}
            label="Movies"
            value={stats.totalMovies}
          />
          <StatCard
            icon={<TelevisionSimpleIcon size={20} />}
            label="Series"
            value={stats.totalSeries}
          />
          <StatCard
            icon={<CheckIcon size={20} />}
            label="Watched"
            value={stats.watched}
            color="text-success"
          />
          <StatCard
            icon={<PlayIcon size={20} />}
            label="Watching"
            value={stats.watching}
            color="text-accent"
          />
          <StatCard
            icon={<ClockIcon size={20} />}
            label="Pending"
            value={stats.pending}
            color="text-warning"
          />
          <StatCard
            icon={<XIcon size={20} />}
            label="Dropped"
            value={stats.dropped}
          />
        </div>
      )}

      {/* Pending invitations */}
      {invitations && invitations.length > 0 && (
        <div className="flex flex-col gap-4 lg:max-w-xl">
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
          <div className="flex flex-col gap-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-xl border border-separator bg-surface px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-accent">
                  <EnvelopeSimpleIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <strong>{inv.invitedBy.name}</strong> invited you to{" "}
                    <strong>{inv.playlist.name}</strong>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {timeAgo(inv.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    isPending={acceptInvitation.isPending}
                    onPress={() =>
                      acceptInvitation.mutate({ invitationId: inv.id })
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    isPending={declineInvitation.isPending}
                    onPress={() =>
                      declineInvitation.mutate({ invitationId: inv.id })
                    }
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div className="flex flex-col gap-4 lg:max-w-xl">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="rounded-xl border border-separator bg-surface">
          {activityLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="divide-y divide-separator">
              {activity.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type] ?? PlusCircleIcon;
                const color = ACTIVITY_COLOR[item.type] ?? "text-muted";
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    {/* Icon */}
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary ${color}`}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {formatActivityMessage(
                          item.type,
                          item.user.name,
                          item.movieTitle,
                          item.metadata,
                        )}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <Link
                          href={`/lists/${item.playlist.slug}`}
                          className="hover:text-accent"
                        >
                          {item.playlist.name}
                        </Link>
                        <span>•</span>
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* User avatar */}
                    {item.user.image ? (
                      <Image
                        src={item.user.image}
                        alt={item.user.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-secondary text-[10px] font-bold text-muted">
                        {item.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted">
              No activity yet. Start adding movies to your lists!
            </div>
          )}
        </div>
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
  value: number;
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
