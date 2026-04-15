"use client";

import Image from "next/image";

interface ResultCardProps {
  title: string;
  posterPath: string | null;
  mediaType: "movie" | "tv";
  onClick: () => void;
}

export default function ResultCard({
  title,
  posterPath,
  mediaType,
  onClick,
}: ResultCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-surface">
        {posterPath ? (
          <Image
            src={posterPath}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <span className="text-sm">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
      </div>
      <div className="mt-2 flex items-start gap-1.5">
        <span className="rounded bg-accent-soft-hover px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
          {mediaType === "movie" ? "Movie" : "TV"}
        </span>
        <p className="line-clamp-2 text-left text-sm font-medium text-foreground">
          {title}
        </p>
      </div>
    </button>
  );
}
