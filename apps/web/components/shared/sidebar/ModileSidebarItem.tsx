"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

export default function MobileSidebarItem({
  logo,
  path,
}: {
  logo: React.ReactNode;
  path: string;
}) {
  const currentPath = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [currentPath]);

  const isCurrent = path === currentPath;

  return (
    <li
      className={cn(
        "flex w-full rounded-lg hover:bg-background",
        isCurrent ? "bg-background" : "",
      )}
    >
      <Link
        onClick={() => {
          haptic();
          if (!isCurrent) {
            setIsLoading(true);
          }
        }}
        href={path}
        className="m-auto px-3 py-2"
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          logo
        )}
      </Link>
    </li>
  );
}
