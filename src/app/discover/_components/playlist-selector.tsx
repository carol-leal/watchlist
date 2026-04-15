"use client";

import { Label, ListBox, Select } from "@heroui/react";
import { type UserPlaylists } from "~/types";

interface PlaylistSelectorProps {
  playlists: UserPlaylists;
  selectedPlaylistId: string;
  onSelectionChange: (playlistId: string) => void;
}

export default function PlaylistSelector({
  playlists,
  selectedPlaylistId,
  onSelectionChange,
}: PlaylistSelectorProps) {
  return (
    <Select
      placeholder="Select a list"
      value={selectedPlaylistId || null}
      onChange={(value) => {
        if (value) onSelectionChange(String(value));
      }}
      className="w-60"
    >
      <Label>Add to list</Label>
      <ListBox>
        {playlists.map((p) => (
          <ListBox.Item key={p.id} id={p.id} textValue={p.name}>
            {p.name}
          </ListBox.Item>
        ))}
      </ListBox>
    </Select>
  );
}
