"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  ExternalLink,
} from "lucide-react";
import {
  useSupabaseStatus,
  useToggleSupabaseSync,
  useSyncToSupabaseNow,
} from "@karakeep/shared-react/hooks/users";
import { SettingsSection } from "./SettingsPage";

export default function SupabaseSettings() {
  const { data: statusData, isLoading, refetch } = useSupabaseStatus();
  const isEnabled = statusData?.enabled ?? true;
  const isConnected = statusData?.connected ?? false;
  const supabaseUrl = statusData?.url ?? "";
  const bookmarkCount = statusData?.bookmarkCount ?? 0;
  const connectionError = statusData?.error;

  const toggleMutation = useToggleSupabaseSync({
    onSuccess: (data) => {
      toast({
        description: data.enabled
          ? "Supabase synchronization enabled."
          : "Supabase synchronization disabled.",
      });
      refetch();
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
        refetch();
      } else {
        toast({
          description: res.reason || "Supabase sync completed.",
          variant: "destructive",
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

  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const sqlEditorUrl = projectId
    ? `https://supabase.com/dashboard/project/${projectId}/sql`
    : "https://supabase.com/dashboard";

  return (
    <SettingsSection title="Supabase — Cloud Database">
      <div className="space-y-4">
        {/* Connection Status Card */}
        <div className="rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : isConnected ? (
                <Wifi className="h-5 w-5 text-emerald-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-rose-500" />
              )}
              <div>
                <div className="flex items-center gap-2 text-base font-medium">
                  <Database className="h-4 w-4 text-primary" />
                  <span>Supabase Connection</span>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                      <XCircle className="h-3.5 w-3.5" /> Not Connected
                    </span>
                  )}
                </div>
                {supabaseUrl && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {supabaseUrl}
                  </p>
                )}
                {isConnected && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {bookmarkCount} bookmark{bookmarkCount !== 1 ? "s" : ""} in
                    Supabase
                  </p>
                )}
                {connectionError && !isConnected && (
                  <p className="mt-0.5 max-w-xs truncate text-xs text-rose-500">
                    {connectionError}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => refetch()}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {!isConnected && (
            <div className="mt-3 rounded-md bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Setup required:</strong> Run the SQL schema in your
                Supabase project to create the required tables.
              </p>
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-700 underline dark:text-amber-300"
              >
                Open SQL Editor <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Sync Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-base font-medium">
              <span>Automatic Sync</span>
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
              Automatically sync all imported bookmarks, tags, and lists to
              Supabase on every change.
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

        {/* Manual Sync */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h4 className="text-sm font-medium">Sync All Data Now</h4>
            <p className="text-xs text-muted-foreground">
              Push all current bookmarks, tags, and lists to Supabase
              immediately.
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
            {syncNowMutation.isPending ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
