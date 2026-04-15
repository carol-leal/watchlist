"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CaretDownIcon,
  CaretUpIcon,
  FolderIcon,
  PopcornIcon,
} from "@phosphor-icons/react";
import { type UserPlaylists } from "~/types";

interface SidebarListDropdownProps {
  lists: UserPlaylists;
}

export default function SidebarListDropdown({
  lists,
}: SidebarListDropdownProps) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted hover:bg-default/50 hover:text-foreground flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      >
        <span className="flex items-center gap-3">
          <FolderIcon size={20} />
          My Lists
        </span>
        {isOpen ? <CaretUpIcon size={16} /> : <CaretDownIcon size={16} />}
      </button>
      {isOpen && (
        <div className="ml-4 flex flex-col gap-0.5 border-l border-separator pl-2">
          {lists.length === 0 ? (
            <span className="text-muted px-3 py-1.5 text-xs">No lists yet</span>
          ) : (
            lists.map((list) => {
              const href = `/lists/${list.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={list.id}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
                    isActive
                      ? "bg-default text-foreground"
                      : "text-muted hover:bg-default/50 hover:text-foreground"
                  }`}
                >
                  {/* Popcorn icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-default/60">
                    <PopcornIcon size={16} className="text-muted" />
                  </div>

                  {/* Name + description */}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-tight">
                      {list.name}
                    </span>
                    {list.description && (
                      <span className="block truncate text-xs leading-tight text-muted/70">
                        {list.description}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
