"use client";

import { SearchField, Button } from "@heroui/react";

interface ListSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  totalFiltered: number;
  totalAll: number;
}

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "WATCHING", label: "Watching" },
  { value: "WATCHED", label: "Watched" },
  { value: "DROPPED", label: "Dropped" },
];

export default function ListSearchBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalFiltered,
  totalAll,
}: ListSearchBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField
          aria-label="Search movies in list"
          value={search}
          onChange={onSearchChange}
          className="w-full max-w-md"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by title, genre, or person..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? "primary" : "outline"}
              onPress={() => onStatusFilterChange(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted">
        Showing {totalFiltered} of {totalAll} movie
        {totalAll !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
