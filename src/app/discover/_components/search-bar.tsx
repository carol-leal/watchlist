"use client";

import { useState } from "react";
import { SearchField } from "@heroui/react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (v: string) => {
    const trimmed = v.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <SearchField
      aria-label="Search movies and TV shows"
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      isDisabled={isLoading}
      className="w-full max-w-2xl"
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search for movies or TV shows..." />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
