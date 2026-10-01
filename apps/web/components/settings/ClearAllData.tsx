"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";

import { useClearAllData } from "@karakeep/shared-react/hooks/users";

const CONFIRM_PHRASE = "delete my data";

export function ClearAllDataCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [typedPhrase, setTypedPhrase] = useState("");

  const isConfirmed = typedPhrase.toLowerCase() === CONFIRM_PHRASE;

  const clearAllDataMutation = useClearAllData({
    onSuccess: () => {
      toast({
        description: "All data cleared. You can now import fresh data.",
      });
      setIsDialogOpen(false);
      setTypedPhrase("");
    },
    onError: (error) => {
      toast({
        description:
          error?.message || "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpen = () => {
    setTypedPhrase("");
    setIsDialogOpen(true);
  };

  const handleClear = () => {
    if (!isConfirmed) return;
    clearAllDataMutation.mutate({ confirmPhrase: typedPhrase });
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5 transition-all hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-full bg-destructive/10 p-2">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-destructive">Clear All Data</h3>
          <p className="text-sm text-muted-foreground">
            Permanently wipe all bookmarks, tags, lists, and reading history.
            This cannot be undone.
          </p>
        </div>
        <ActionConfirmingDialog
          open={isDialogOpen}
          setOpen={(open) => {
            setIsDialogOpen(open);
            if (!open) setTypedPhrase("");
          }}
          title="⚠️ Permanently Delete ALL Data?"
          description={
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="font-semibold text-destructive">
                    This will permanently delete ALL your data from both the
                    local database and Supabase.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All bookmarks, tags, lists, and reading history will be
                    wiped. This action <strong>cannot be undone</strong>.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Type{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-destructive">
                    {CONFIRM_PHRASE}
                  </code>{" "}
                  to confirm:
                </p>
                <Input
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  className="border-destructive/40 font-mono focus-visible:ring-destructive"
                  autoFocus
                />
              </div>
            </div>
          }
          actionButton={() => (
            <ActionButton
              variant="destructive"
              loading={clearAllDataMutation.isPending}
              onClick={handleClear}
              disabled={!isConfirmed}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isConfirmed
                ? "Permanently Delete All Data"
                : `Type "${CONFIRM_PHRASE}" to enable`}
            </ActionButton>
          )}
        >
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={handleOpen}
          >
            <AlertTriangle className="h-4 w-4" />
            Clear All Data
          </Button>
        </ActionConfirmingDialog>
      </CardContent>
    </Card>
  );
}
