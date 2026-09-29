"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@karakeep/shared-react/trpc";
import SidebarItem from "./SidebarItem";
import { TSidebarItem } from "./TSidebarItem";

export function SidebarNavList({ items }: { items: TSidebarItem[] }) {
  const api = useTRPC();
  const { data: stats } = useQuery({
    ...api.users.stats.queryOptions(),
    staleTime: 30_000,
  });

  const getCountForPath = (path: string): number | undefined => {
    if (!stats) return undefined;
    if (path.includes("/dashboard/bookmarks")) return stats.numBookmarks;
    if (path.includes("/dashboard/tags")) return stats.numTags;
    if (path.includes("/dashboard/highlights")) return stats.numHighlights;
    if (path.includes("/dashboard/archive")) return stats.numArchived;
    if (path.includes("/dashboard/favourites")) return stats.numFavorites;
    if (path === "/dashboard/lists") return stats.numLists;
    return undefined;
  };

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <SidebarItem
          key={item.name}
          logo={item.icon}
          name={item.name}
          path={item.path}
          count={
            item.count ?? (item.right ? undefined : getCountForPath(item.path))
          }
          right={item.right}
        />
      ))}
    </ul>
  );
}
