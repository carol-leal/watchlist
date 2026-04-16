"use client";

import { useEffect, useRef, useState } from "react";
import { SearchField } from "@heroui/react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed) {
      debounceRef.current = setTimeout(() => {
        onSearch(trimmed);
        // Restore focus after search
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 500);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onSearch]);

  const handleSubmit = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
        <SearchField.Input
          placeholder="Search for movies or TV shows..."
          autoFocus
          ref={inputRef}
        />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
