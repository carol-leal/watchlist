"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

export default function SidebarItem({
  href,
  icon,
  label,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-default text-foreground"
          : "text-muted hover:bg-default/50 hover:text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
