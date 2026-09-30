"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { Database, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import {
  useSupabaseStatus,
  useToggleSupabaseSync,
  useSyncToSupabaseNow,
} from "@karakeep/shared-react/hooks/users";
import { SettingsSection } from "./SettingsPage";

export default function SupabaseSettings() {
  const { data: statusData, isLoading } = useSupabaseStatus();
  const isEnabled = statusData?.enabled ?? true;

  const toggleMutation = useToggleSupabaseSync({
    onSuccess: (data) => {
      toast({
        description: data.enabled
          ? "Supabase synchronization enabled."
          : "Supabase synchronization disabled.",
      });
    },
    onError: () => {
      toast({
        description: "Failed to update Supabase sync status.",
        variant: "destructive",
      });
    },
  });

  const syncNowMutation = useSyncToSupabaseNow({
    onSuccess: (res) => {
      if (res.success) {
        toast({
          description: `Successfully synced ${res.count ?? 0} items to Supabase.`,
        });
      } else {
        toast({
          description: res.reason || res.error || "Supabase sync completed.",
        });
      }
    },
    onError: (err) => {
      toast({
        description: err.message || "Failed to trigger Supabase sync.",
        variant: "destructive",
      });
    },
  });

  return (
    <SettingsSection title="Supabase Integration & Cloud Sync">
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-base font-medium">
              <Database className="h-5 w-5 text-primary" />
              <span>Automatic Supabase Sync</span>
              {isEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  <XCircle className="h-3.5 w-3.5" /> Disabled
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically store and sync all imported data, links, notes,
              tags, and lists to Supabase tables in real-time.
            </p>
          </div>
          <Switch
            checked={isEnabled}
            disabled={isLoading || toggleMutation.isPending}
            onCheckedChange={(checked) => {
              toggleMutation.mutate({ enabled: checked });
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <h4 className="text-sm font-medium">Manual Synchronization</h4>
            <p className="text-xs text-muted-foreground">
              Trigger an immediate sync of all current bookmarks and lists to
              Supabase.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!isEnabled || syncNowMutation.isPending}
            onClick={() => syncNowMutation.mutate()}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncNowMutation.isPending ? "animate-spin" : ""}`}
            />
            {syncNowMutation.isPending ? "Syncing..." : "Sync Now to Supabase"}
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
