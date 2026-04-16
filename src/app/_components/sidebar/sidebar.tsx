"use client";

import { Button, Drawer, Separator } from "@heroui/react";
import { CompassIcon, ListIcon, PlusIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../logo";
import SidebarItem from "./sidebar-item";
import SidebarListDropdown from "./sidebar-list-dropdown";
import SidebarAccount from "./sidebar-account";
import NewListModal from "./new-list-modal";
import { type UserPlaylists } from "~/types";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  lists: UserPlaylists;
}

function SidebarContent({
  user,
  lists,
  onNavigate,
  onNewList,
}: SidebarProps & { onNavigate?: () => void; onNewList: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-4 py-5">
        <Link href="/" onClick={onNavigate}>
          <Logo size="small" />
        </Link>
      </div>

      <Separator />

      {/* Nav items */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <SidebarItem
          href="/discover"
          icon={<CompassIcon size={20} />}
          label="Discover"
          onClick={onNavigate}
        />

        <SidebarListDropdown lists={lists} />
      </nav>

      <Separator />

      {/* New List */}
      <div className="px-3 py-3">
        <Button
          variant="primary"
          fullWidth
          size="sm"
          onPress={() => {
            onNewList();
            onNavigate?.();
          }}
        >
          <PlusIcon size={16} />
          New List
        </Button>
      </div>

      <Separator />

      {/* Account */}
      <div className="px-1 py-3">
        <SidebarAccount user={user} lists={lists} />
      </div>
    </div>
  );
}

export default function Sidebar({ user, lists }: SidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);

  // Close mobile drawer when resizing to desktop breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => {
      if (mq.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {/* Mobile burger button */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <ListIcon size={22} />
        </Button>
      </div>

      {/* Mobile drawer */}
      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Backdrop variant="opaque">
          <Drawer.Content placement="left" className="w-64">
            <Drawer.Body className="p-0">
              <SidebarContent
                user={user}
                lists={lists}
                onNavigate={() => setDrawerOpen(false)}
                onNewList={() => setNewListOpen(true)}
              />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      {/* Desktop sidebar */}
      <aside className="bg-surface border-separator hidden h-screen w-64 shrink-0 border-r md:flex md:flex-col">
        <SidebarContent
          user={user}
          lists={lists}
          onNewList={() => setNewListOpen(true)}
        />
      </aside>

      {/* New list modal */}
      <NewListModal
        isOpen={newListOpen}
        onClose={() => setNewListOpen(false)}
      />
    </>
  );
}
