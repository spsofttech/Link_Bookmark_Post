"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { ExternalLink, NotepadText } from "lucide-react";

export function renderTextWithLinks(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      let url = part;
      let trailingPunct = "";
      const match = part.match(/([.,;)]+)$/);
      if (match) {
        trailingPunct = match[1];
        url = part.slice(0, -trailingPunct.length);
      }

      return (
        <span key={index}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="break-all font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
          {trailingPunct}
        </span>
      );
    }
    return part;
  });
}

interface NotePreviewProps {
  note: string;
  bookmarkId: string;
  className?: string;
}

export function NotePreview({ note, bookmarkId, className }: NotePreviewProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!note?.trim()) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex cursor-pointer items-center gap-1.5 text-sm font-light italic text-gray-500 dark:text-gray-400",
            className,
          )}
        >
          <NotepadText className="size-5 shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            {renderTextWithLinks(note)}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-96 max-w-[calc(100vw-2rem)]"
        align="start"
      >
        <div className="space-y-3">
          <div className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
            {renderTextWithLinks(note)}
          </div>
          <div className="flex justify-end">
            <Link href={`/dashboard/preview/${bookmarkId}`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsOpen(false)}
              >
                {t("actions.edit_notes")}
                <ExternalLink className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
