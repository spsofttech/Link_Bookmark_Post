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

      const mappedBookmarks = parsedImport.bookmarks.map((b) => ({
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
      }));

      const CHUNK_SIZE = 250;
      let totalImported = 0;
      let totalSkipped = 0;
      let rootListId: string | null = null;

      const fileSessionId = `import_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      currentImportIds.current.set(file, fileSessionId);
      setImportProgress((prev) => ({
        ...prev,
        [fileSessionId]: { done: 0, total: mappedBookmarks.length },
      }));

      for (let i = 0; i < mappedBookmarks.length; i += CHUNK_SIZE) {
        const chunk = mappedBookmarks.slice(i, i + CHUNK_SIZE);
        const chunkResult = await directImportBookmarks({
          listName: t("settings.import.imported_bookmarks"),
          bookmarks: chunk,
        });

        totalImported += chunkResult.importedCount;
        totalSkipped += chunkResult.skippedCount;
        if (!rootListId && chunkResult.rootListId) {
          rootListId = chunkResult.rootListId;
        }

        const doneCount = Math.min(i + chunk.length, mappedBookmarks.length);
        setImportProgress((prev) => ({
          ...prev,
          [fileSessionId]: { done: doneCount, total: mappedBookmarks.length },
        }));
      }

      // Perform a complete invalidation of all bookmark, list, tag, and stats queries
      // so homepage, grids, and counters update instantly with imported data
      await Promise.all([
        queryClient.invalidateQueries(api.bookmarks.pathFilter()),
        queryClient.invalidateQueries(api.lists.pathFilter()),
        queryClient.invalidateQueries(api.tags.pathFilter()),
        queryClient.invalidateQueries(api.users.stats.pathFilter()),
      ]);

      return {
        counts: {
          successes: totalImported,
          failures: 0,
          alreadyExisted: totalSkipped,
          total: mappedBookmarks.length,
        },
        rootListId,
        importSessionId: fileSessionId,
      };
    },
    onSuccess: async (result, variables) => {
      const id = currentImportIds.current.get(variables.file);
      if (id) {
        setImportProgress((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
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
