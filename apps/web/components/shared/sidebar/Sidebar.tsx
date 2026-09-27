import { useTranslation } from "@/lib/i18n/server";
import { TFunction } from "i18next";

import serverConfig from "@karakeep/shared/config";

import { SidebarNavList } from "./SidebarNavList";
import SidebarVersion from "./SidebarVersion";
import { TSidebarItem } from "./TSidebarItem";

export default async function Sidebar({
  items,
  extraSections,
}: {
  items: (t: TFunction) => TSidebarItem[];
  extraSections?: React.ReactNode;
}) {
  // oxlint-disable-next-line rules-of-hooks
  const { t } = await useTranslation();

  return (
    <aside className="flex h-[calc(100vh-64px)] w-60 flex-col gap-5 border-r p-4 xl:w-72">
      <div>
        <SidebarNavList items={items(t)} />
      </div>
      {extraSections}
      <SidebarVersion
        serverVersion={serverConfig.serverVersion}
        changeLogVersion={serverConfig.changelogVersion}
      />
    </aside>
  );
}
