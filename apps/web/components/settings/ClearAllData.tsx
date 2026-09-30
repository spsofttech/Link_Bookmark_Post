"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

import { useClearAllData } from "@karakeep/shared-react/hooks/users";

export function ClearAllDataCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const clearAllDataMutation = useClearAllData({
    onSuccess: () => {
      toast({
        description:
          "All bookmarks, tags, and lists cleared successfully! You can now import fresh data.",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        description:
          error?.message || "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClear = () => {
    clearAllDataMutation.mutate();
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
            Wipe all bookmarks, tags, lists, and reading history so you can
            start with a fresh library.
          </p>
        </div>
        <ActionConfirmingDialog
          open={isDialogOpen}
          setOpen={setIsDialogOpen}
          title="Clear All Library Data?"
          description={
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">
                  This action will delete all your bookmarks, tags, and lists.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your user account and settings will remain active so you can
                  import fresh data.
                </p>
              </div>
            </div>
          }
          actionButton={() => (
            <ActionButton
              variant="destructive"
              loading={clearAllDataMutation.isPending}
              onClick={handleClear}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Confirm Clear All Data
            </ActionButton>
          )}
        >
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </Button>
        </ActionConfirmingDialog>
      </CardContent>
    </Card>
  );
}
