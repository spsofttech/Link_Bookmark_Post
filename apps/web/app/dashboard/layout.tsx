import { redirect } from "next/navigation";
import SidebarLayout from "@/components/shared/sidebar/SidebarLayout";
import { ReaderSettingsProvider } from "@/lib/readerSettings";
import { UserSettingsContextProvider } from "@/lib/userSettings";
import { api } from "@/server/api/client";
import { getServerAuthSession } from "@/server/auth";
import { TRPCError } from "@trpc/server";

import { tryCatch } from "@karakeep/shared/tryCatch";

export default async function Dashboard({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const userSettings = await tryCatch(api.users.settings());

  if (userSettings.error) {
    if (userSettings.error instanceof TRPCError) {
      if (
        userSettings.error.code === "NOT_FOUND" ||
        userSettings.error.code === "UNAUTHORIZED"
      ) {
        redirect("/logout");
      }
    }
    console.error(
      "Failed to load user settings in dashboard layout:",
      userSettings.error,
    );
  }

  const fallbackSettings = {
    bookmarkClickAction: "open_original_link" as const,
    archiveDisplayBehaviour: "show" as const,
    timezone: "UTC",
    backupsEnabled: false,
    backupsFrequency: "weekly" as const,
    backupsRetentionDays: 30,
    readerFontSize: null,
    readerLineHeight: null,
    readerFontFamily: null,
    autoTaggingEnabled: null,
    autoSummarizationEnabled: null,
    tagStyle: "titlecase-spaces" as const,
    curatedTagIds: null,
    inferredTagLang: null,
  };

  const initialUserSettings = userSettings.data || fallbackSettings;

  return (
    <UserSettingsContextProvider userSettings={initialUserSettings}>
      <ReaderSettingsProvider>
        <SidebarLayout modal={modal}>{children}</SidebarLayout>
      </ReaderSettingsProvider>
    </UserSettingsContextProvider>
  );
}
