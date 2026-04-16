"use client";

import {
  Avatar,
  Button,
  ListBox,
  Popover,
  Select,
  Switch,
  Tooltip,
} from "@heroui/react";
import { GearIcon, SignOutIcon } from "@phosphor-icons/react";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { useUserPreferences } from "../user-preferences";
import { type UserPlaylists } from "~/types";

interface SidebarAccountProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  lists: UserPlaylists;
}

export default function SidebarAccount({ user, lists }: SidebarAccountProps) {
  const router = useRouter();
  const { preferences, updatePreference } = useUserPreferences();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2">
      <Avatar size="sm">
        {user.image && <Avatar.Image src={user.image} />}
        <Avatar.Fallback>
          {user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </Avatar.Fallback>
      </Avatar>
      <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
        {user.name}
      </span>

      {/* Settings popover */}
      <Popover>
        <Tooltip>
          <Tooltip.Trigger>
            <Popover.Trigger>
              <Button variant="ghost" isIconOnly size="sm">
                <GearIcon size={18} />
              </Button>
            </Popover.Trigger>
          </Tooltip.Trigger>
          <Tooltip.Content>Preferences</Tooltip.Content>
        </Tooltip>
        <Popover.Content placement="top end" className="w-72">
          <Popover.Dialog>
            <Popover.Heading className="mb-3 text-sm font-semibold">
              Preferences
            </Popover.Heading>
            <div className="flex flex-col gap-4">
              {/* Show list stats */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Show list stats</span>
                <Switch
                  isSelected={preferences.showListStats}
                  onChange={(isSelected) =>
                    updatePreference("showListStats", isSelected)
                  }
                  size="sm"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
              </div>

              {/* Status select mode */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm">Status select mode</span>
                <Select
                  defaultSelectedKey={preferences.statusSelectMode}
                  onSelectionChange={(key) => {
                    if (key) {
                      updatePreference(
                        "statusSelectMode",
                        key as "dropdown" | "buttons",
                      );
                    }
                  }}
                >
                  <Select.Trigger className="w-full border border-separator">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="dropdown" textValue="Dropdown">
                        Dropdown
                      </ListBox.Item>
                      <ListBox.Item id="buttons" textValue="Buttons">
                        Buttons
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {/* Default list */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm">Default list for new movies</span>
                <Select
                  defaultSelectedKey={preferences.defaultPlaylistId ?? "none"}
                  onSelectionChange={(key) => {
                    if (key) {
                      updatePreference(
                        "defaultPlaylistId",
                        key === "none" ? null : String(key),
                      );
                    }
                  }}
                >
                  <Select.Trigger className="w-full border border-separator">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="none" textValue="None">
                        None
                      </ListBox.Item>
                      {lists.map((list) => (
                        <ListBox.Item
                          key={list.id}
                          id={list.id}
                          textValue={list.name}
                        >
                          {list.name}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <Tooltip>
        <Tooltip.Trigger>
          <Button variant="ghost" isIconOnly size="sm" onPress={handleSignOut}>
            <SignOutIcon size={18} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Sign out</Tooltip.Content>
      </Tooltip>
    </div>
  );
}
