"use client";

import { Avatar, Button, Tooltip } from "@heroui/react";
import { SignOutIcon } from "@phosphor-icons/react";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";

interface SidebarAccountProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export default function SidebarAccount({ user }: SidebarAccountProps) {
  const router = useRouter();

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
