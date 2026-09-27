import * as React from "react";
import Image from "next/image";
import { z } from "zod";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import useUpload from "@/lib/hooks/upload-file";
import { useDialogFormReset } from "@/lib/hooks/useDialogFormReset";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarIcon,
  Image as ImageIcon,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";

import {
  useAttachBookmarkAsset,
  useDetachBookmarkAsset,
  useReplaceBookmarkAsset,
} from "@karakeep/shared-react/hooks/assets";
import { useUpdateBookmark } from "@karakeep/shared-react/hooks/bookmarks";
import { useTRPC } from "@karakeep/shared-react/trpc";
import {
  BookmarkTypes,
  ZBookmark,
  zUpdateBookmarksRequestSchema,
} from "@karakeep/shared/types/bookmarks";
import { getAssetUrl } from "@karakeep/shared/utils/assetUtils";
import {
  getBookmarkLinkImageUrl,
  getBookmarkTitle,
} from "@karakeep/shared/utils/bookmarkUtils";

import { BookmarkTagsEditor } from "./BookmarkTagsEditor";

const formSchema = zUpdateBookmarksRequestSchema.extend({
  createdAt: z.date().optional(),
  datePublished: z.date().nullish(),
  dateModified: z.date().nullish(),
});
type BookmarkFormValues = z.infer<typeof formSchema>;

export function EditBookmarkDialog({
  open,
  setOpen,
  bookmark,
  initialFocusField = null,
  children,
}: {
  bookmark: ZBookmark;
  children?: React.ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
  initialFocusField?: "image" | "title" | "url" | "description" | null;
}) {
  const api = useTRPC();
  const { t } = useTranslation();

  const titleInputRef = React.useRef<HTMLInputElement | null>(null);
  const urlInputRef = React.useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const imageSectionRef = React.useRef<HTMLDivElement | null>(null);
  const imageFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const bannerAsset = bookmark.assets.find(
    (a) => a.assetType === "bannerImage",
  );
  const linkImgDetails =
    bookmark.content.type === BookmarkTypes.LINK
      ? getBookmarkLinkImageUrl(bookmark.content)
      : null;
  const currentImgUrl = bannerAsset
    ? getAssetUrl(bannerAsset.id)
    : linkImgDetails?.url;

  const { mutate: uploadAsset, isPending: isUploadingAsset } = useUpload({
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: e.error,
      });
    },
  });

  const { mutate: attachAsset, isPending: isAttachingAsset } =
    useAttachBookmarkAsset({
      onSuccess: () => {
        toast({ description: "Cover image updated successfully!" });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          title: "Failed to set cover image",
          description: e.message,
        });
      },
    });

  const { mutate: replaceAsset, isPending: isReplacingAsset } =
    useReplaceBookmarkAsset({
      onSuccess: () => {
        toast({ description: "Cover image replaced successfully!" });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          title: "Failed to replace cover image",
          description: e.message,
        });
      },
    });

  const { mutate: detachAsset, isPending: isDetachingAsset } =
    useDetachBookmarkAsset({
      onSuccess: () => {
        toast({ description: "Cover image removed!" });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          title: "Failed to remove cover image",
          description: e.message,
        });
      },
    });

  const processImageFile = React.useCallback(
    (file: File) => {
      toast({ description: "Uploading cover image..." });
      uploadAsset(file, {
        onSuccess: (resp) => {
          if (bannerAsset) {
            replaceAsset({
              bookmarkId: bookmark.id,
              oldAssetId: bannerAsset.id,
              newAssetId: resp.assetId,
            });
          } else {
            attachAsset({
              bookmarkId: bookmark.id,
              asset: {
                id: resp.assetId,
                assetType: "bannerImage",
              },
            });
          }
        },
      });
    },
    [uploadAsset, bannerAsset, bookmark.id, replaceAsset, attachAsset],
  );

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const handleDialogPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handleDialogPaste);
    return () => window.removeEventListener("paste", handleDialogPaste);
  }, [open, processImageFile]);

  React.useEffect(() => {
    if (open && initialFocusField) {
      const timer = setTimeout(() => {
        if (initialFocusField === "title") {
          titleInputRef.current?.focus();
          titleInputRef.current?.select();
        } else if (initialFocusField === "url") {
          urlInputRef.current?.focus();
          urlInputRef.current?.select();
        } else if (initialFocusField === "description") {
          descriptionInputRef.current?.focus();
          descriptionInputRef.current?.select();
        } else if (initialFocusField === "image") {
          imageSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, initialFocusField]);

  const { data: assetContent, isLoading: isAssetContentLoading } = useQuery(
    api.bookmarks.getBookmark.queryOptions(
      {
        bookmarkId: bookmark.id,
        includeContent: true,
      },
      {
        enabled: open && bookmark.content.type == BookmarkTypes.ASSET,
        select: (b) =>
          b.content.type == BookmarkTypes.ASSET ? b.content.content : null,
      },
    ),
  );

  const bookmarkToDefault = (bookmark: ZBookmark): BookmarkFormValues => ({
    bookmarkId: bookmark.id,
    summary: bookmark.summary,
    note: bookmark.note === null ? undefined : bookmark.note,
    title: getBookmarkTitle(bookmark),
    createdAt: bookmark.createdAt ?? new Date(),
    // Link specific defaults (only if bookmark is a link)
    url:
      bookmark.content.type === BookmarkTypes.LINK
        ? bookmark.content.url
        : undefined,
    description:
      bookmark.content.type === BookmarkTypes.LINK
        ? (bookmark.content.description ?? "")
        : undefined,
    author:
      bookmark.content.type === BookmarkTypes.LINK
        ? (bookmark.content.author ?? "")
        : undefined,
    publisher:
      bookmark.content.type === BookmarkTypes.LINK
        ? (bookmark.content.publisher ?? "")
        : undefined,
    datePublished:
      bookmark.content.type === BookmarkTypes.LINK
        ? bookmark.content.datePublished
        : undefined,
    // Asset specific fields
    assetContent: assetContent ?? undefined,
  });

  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: bookmarkToDefault(bookmark),
  });

  const { mutate: updateBookmarkMutate, isPending: isUpdatingBookmark } =
    useUpdateBookmark({
      onSuccess: (updatedBookmark) => {
        toast({ description: "Bookmark details updated successfully!" });
        // Close the dialog after successful detail update
        setOpen(false);
        // Reset form with potentially updated data
        form.reset(bookmarkToDefault(updatedBookmark));
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Failed to update bookmark",
          description: error.message,
        });
      },
    });

  function onSubmit(values: BookmarkFormValues) {
    // Ensure optional fields that are empty strings are sent as null/undefined if appropriate
    const payload = {
      ...values,
      title: values.title ?? null,
    };
    updateBookmarkMutate(payload);
  }

  // Reset form only when dialog is initially opened to preserve unsaved changes
  // This prevents losing unsaved title edits when tags are updated, which would
  // cause the bookmark prop to change and trigger a form reset
  useDialogFormReset(open, form, bookmarkToDefault(bookmark));

  // Update assetContent field when it's loaded
  React.useEffect(() => {
    if (assetContent && bookmark.content.type === BookmarkTypes.ASSET) {
      form.setValue("assetContent", assetContent);
    }
  }, [assetContent, bookmark.content.type, form]);

  const isLink = bookmark.content.type === BookmarkTypes.LINK;
  const isAsset = bookmark.content.type === BookmarkTypes.ASSET;

  let dialogTitle = t("bookmark_editor.title");
  let dialogSubtitle = t("bookmark_editor.subtitle");
  let submitLabel = t("bookmark_editor.save_changes");

  if (initialFocusField === "image") {
    dialogTitle = "Edit Cover Image";
    dialogSubtitle = "Upload or change the cover thumbnail for this bookmark";
  } else if (initialFocusField === "title") {
    dialogTitle = "Edit Title";
    dialogSubtitle = "Update the title for this bookmark";
    submitLabel = "Save Title";
  } else if (initialFocusField === "url") {
    dialogTitle = "Edit URL";
    dialogSubtitle = "Update the web link URL for this bookmark";
    submitLabel = "Save URL";
  } else if (initialFocusField === "description") {
    dialogTitle = "Edit Description";
    dialogSubtitle = "Update the description for this bookmark";
    submitLabel = "Save Description";
  }

  const renderImageSection = () => (
    <div
      ref={imageSectionRef}
      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3.5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ImageIcon className="size-4 text-primary" />
          Cover Image / Thumbnail
        </FormLabel>
        {bannerAsset && (
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
            Custom Image
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-background shadow-sm">
          {currentImgUrl ? (
            <Image
              src={currentImgUrl}
              alt="Bookmark thumbnail preview"
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted/40 text-muted-foreground">
              <ImageIcon className="size-8 opacity-40" />
              <span className="text-[10px]">No image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={
                isUploadingAsset || isAttachingAsset || isReplacingAsset
              }
              onClick={() => imageFileInputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 size-3.5" />
              {currentImgUrl ? "Change Image" : "Upload Image"}
            </Button>

            {bannerAsset && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isDetachingAsset}
                onClick={() =>
                  detachAsset({
                    bookmarkId: bookmark.id,
                    assetId: bannerAsset.id,
                  })
                }
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Remove Image
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload or replace the cover thumbnail shown on cards.
          </p>
        </div>
      </div>

      <input
        type="file"
        ref={imageFileInputRef}
        onChange={handleImageFileChange}
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp"
      />
    </div>
  );

  const renderTitleField = () => (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("common.title")}</FormLabel>
          <FormControl>
            <Input
              placeholder="Bookmark title"
              {...field}
              ref={(e) => {
                field.ref(e);
                titleInputRef.current = e;
              }}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderUrlField = () => (
    <FormField
      control={form.control}
      name="url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("common.url")}</FormLabel>
          <FormControl>
            <Input
              placeholder="https://example.com"
              {...field}
              ref={(e) => {
                field.ref(e);
                urlInputRef.current = e;
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderDescriptionField = () => (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("common.description")}</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Bookmark description"
              {...field}
              rows={4}
              ref={(e) => {
                field.ref(e);
                descriptionInputRef.current = e;
              }}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogSubtitle}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {initialFocusField === "image" && renderImageSection()}
            {initialFocusField === "title" && renderTitleField()}
            {initialFocusField === "url" && isLink && renderUrlField()}
            {initialFocusField === "description" &&
              isLink &&
              renderDescriptionField()}

            {/* If no specific field selected, render full editor form */}
            {!initialFocusField && (
              <>
                {renderImageSection()}
                {renderTitleField()}
                {isLink && renderUrlField()}

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.note")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Bookmark notes"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isLink && renderDescriptionField()}

                {isLink && (
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.summary")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Bookmark summary"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isAsset && (
                  <FormField
                    control={form.control}
                    name="assetContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("bookmark_editor.extracted_content")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            disabled={isAssetContentLoading}
                            placeholder="Extracted Content"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isLink && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("bookmark_editor.author")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Author name"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="publisher"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("bookmark_editor.publisher")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Publisher name"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="createdAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("common.created_at")}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>
                                    {t("bookmark_editor.pick_a_date")}
                                  </span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isLink && (
                    <FormField
                      control={form.control}
                      name="datePublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>
                            {t("bookmark_editor.date_published")}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>
                                      {t("bookmark_editor.pick_a_date")}
                                    </span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={(date) =>
                                  field.onChange(date ?? null)
                                }
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormItem>
                  <FormLabel>{t("common.tags")}</FormLabel>
                  <FormControl>
                    <BookmarkTagsEditor bookmark={bookmark} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isUpdatingBookmark}
              >
                {initialFocusField === "image" ? "Done" : t("actions.cancel")}
              </Button>
              {initialFocusField !== "image" && (
                <ActionButton type="submit" loading={isUpdatingBookmark}>
                  {submitLabel}
                </ActionButton>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
