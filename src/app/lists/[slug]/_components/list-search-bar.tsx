"use client";

import { SearchField, Button, Select, ListBox } from "@heroui/react";

export type SortOption = "added" | "alpha" | "release" | "rating";

interface ListSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
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

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "added", label: "Latest added" },
  { value: "alpha", label: "Alphabetical" },
  { value: "release", label: "Release date" },
  { value: "rating", label: "Rating" },
];

export default function ListSearchBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
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
            <SearchField.Input placeholder="Search by title" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex flex-wrap items-center gap-2">
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

          <Select
            value={sort}
            onChange={(v) => onSortChange(v as SortOption)}
            className="w-40"
          >
            <Select.Trigger className="border border-separator text-sm">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {SORT_OPTIONS.map(({ value, label }) => (
                  <ListBox.Item key={value} id={value} textValue={label}>
                    {label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted">
        Showing {totalFiltered} of {totalAll} item
        {totalAll !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
