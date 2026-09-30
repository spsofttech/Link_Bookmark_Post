"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SidebarItem({
  name,
  logo,
  path,
  className,
  linkClassName,
  style,
  collapseButton,
  count,
  right = null,
  dropHighlight = false,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
  style?: React.CSSProperties;
  className?: string;
  linkClassName?: string;
  count?: number | string;
  right?: React.ReactNode;
  collapseButton?: React.ReactNode;
  dropHighlight?: boolean;
  onDrop?: React.DragEventHandler;
  onDragOver?: React.DragEventHandler;
  onDragEnter?: React.DragEventHandler;
  onDragLeave?: React.DragEventHandler;
}) {
  const currentPath = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [currentPath]);

  const isCurrent = path === currentPath;

  const rightElement =
    right ??
    (count !== undefined ? (
      <span className="flex items-center px-2.5 text-xs font-light text-muted-foreground">
        {count}
      </span>
    ) : null);

  return (
    <li
      className={cn(
        "relative flex justify-between rounded-lg text-sm transition-colors hover:bg-accent",
        isCurrent ? "bg-accent/50 text-foreground" : "text-muted-foreground",
        dropHighlight && "bg-accent ring-2 ring-primary",
        className,
      )}
      style={style}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      <div className="flex flex-1 items-center">
        {collapseButton}
        <Link
          href={path}
          onClick={() => {
            if (!isCurrent) {
              setIsLoading(true);
            }
          }}
          className={cn(
            "flex flex-1 items-center gap-x-2 rounded-[inherit] px-3 py-2",
            linkClassName,
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          ) : (
            logo
          )}
          <span title={name} className="line-clamp-1 break-all">
            {name}
          </span>
        </Link>
      </div>
      {rightElement}
    </li>
  );
}
