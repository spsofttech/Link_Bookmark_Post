"use client";

import { useState, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { useTranslation } from "@/lib/i18n/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@karakeep/shared-react/trpc";
import {
  ImportSource,
  parseImportFile,
  parseUniversalExcelBuffer,
} from "@karakeep/shared/import-export";

export interface ImportProgress {
  done: number;
  total: number;
}

export function useBookmarkImport() {
  const { t } = useTranslation();
  const api = useTRPC();

  const [importProgress, setImportProgress] = useState<
    Record<string, ImportProgress>
  >({});
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { mutateAsync: directImportBookmarks } = useMutation(
    api.bookmarks.directImportBookmarks.mutationOptions(),
  );
  const currentImportIds = useRef(new Map<File, string>());

  const uploadBookmarkFileMutation = useMutation({
    mutationFn: async ({
      file,
      source,
    }: {
      file: File;
      source: ImportSource;
    }) => {
      // Clear any previous quota error
      setQuotaError(null);

      // Detect if file is Excel (.xlsx / .xls)
      const fileNameLower = file.name.toLowerCase();
      const isExcel =
        fileNameLower.endsWith(".xlsx") ||
        fileNameLower.endsWith(".xls") ||
        source === "excel";

      let parsedImport;
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        parsedImport = parseUniversalExcelBuffer(buffer);
      } else {
        const textContent = await file.text();
        parsedImport = parseImportFile(source, textContent);
      }
      const bookmarkCount = parsedImport.bookmarks.length;

      // Check quota before proceeding
      if (bookmarkCount > 0) {
        const quotaUsage = await queryClient.fetchQuery(
          api.subscriptions.getQuotaUsage.queryOptions(),
        );

        if (
          !quotaUsage.bookmarks.unlimited &&
          quotaUsage.bookmarks.quota !== null
        ) {
          const remaining =
            quotaUsage.bookmarks.quota - quotaUsage.bookmarks.used;

          if (remaining < bookmarkCount) {
            const errorMsg = `Cannot import ${bookmarkCount} bookmarks. You have ${remaining} bookmark${remaining === 1 ? "" : "s"} remaining in your quota of ${quotaUsage.bookmarks.quota}.`;
            setQuotaError(errorMsg);
            throw new Error(errorMsg);
          }
        }
      }

      // Perform fast, direct database import with 100% data preservation
      const directResult = await directImportBookmarks({
        listName: t("settings.import.imported_bookmarks"),
        bookmarks: parsedImport.bookmarks.map((b) => ({
          type: (b.content?.type === "text" ? "text" : "link") as "link" | "text",
          url: b.content?.type === "link" ? b.content.url : undefined,
          title: b.title,
          content: b.content?.type === "text" ? b.content.text : undefined,
          description: b.description,
          note: b.notes,
          favourited: b.favourited,
          imageUrl: b.imageUrl,
          lists: b.lists ?? [],
          tags: b.tags ?? [],
          sourceAddedAt: b.addDate ? new Date(b.addDate * 1000) : undefined,
          archived: b.archived,
        })),
      });

      // Invalidate queries so dashboard and lists update immediately
      await queryClient.invalidateQueries(api.bookmarks.getBookmarks.queryFilter());
      await queryClient.invalidateQueries(api.lists.list.queryFilter());
      await queryClient.invalidateQueries(api.lists.stats.queryFilter());

      return {
        counts: {
          successes: directResult.importedCount,
          failures: 0,
          alreadyExisted: directResult.skippedCount,
          total: directResult.total,
        },
        rootListId: directResult.rootListId,
        importSessionId: null,
      };
    },
    onSuccess: async (result, variables) => {
      currentImportIds.current.delete(variables.file);

      if (result.counts.total === 0) {
        toast({ description: "No bookmarks found in the file." });
        return;
      }

      toast({
        description: `Successfully imported ${result.counts.successes} bookmarks${result.counts.alreadyExisted > 0 ? ` (${result.counts.alreadyExisted} already existed)` : ""}.`,
        variant: "default",
      });
    },
    onError: (error, variables) => {
      const id = currentImportIds.current.get(variables.file);
      setImportProgress((prev) => {
        const next = { ...prev };
        if (id) {
          delete next[id];
        }
        return next;
      });
      currentImportIds.current.delete(variables.file);

      toast({
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    importProgress,
    quotaError,
    clearQuotaError: () => setQuotaError(null),
    runUploadBookmarkFile: uploadBookmarkFileMutation.mutateAsync,
    isImporting: uploadBookmarkFileMutation.isPending,
  };
}
