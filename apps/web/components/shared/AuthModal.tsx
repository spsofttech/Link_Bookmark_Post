"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CredentialsForm from "@/components/signin/CredentialsForm";
import SignUpForm from "@/components/signup/SignUpForm";
import { Sparkles, Lock } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
  message?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
  message,
}: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(initialTab);

  const handleAuthSuccess = () => {
    try {
      localStorage.removeItem("guest_preview_count");
    } catch {
      // Ignore localStorage errors
    }
    onClose();
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <DialogHeader className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-inner">
            <Sparkles className="size-6" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
            {tab === "signin" ? "Sign in to Continue" : "Create Your Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {message ||
              "Unlock unlimited post previews, bookmark saving, and AI template organizing."}
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Lock className="size-4 shrink-0 text-amber-500" />
            <span>{message}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`flex-1 rounded-lg py-2 transition-all duration-200 ${
              tab === "signin"
                ? "bg-background font-bold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 rounded-lg py-2 transition-all duration-200 ${
              tab === "signup"
                ? "bg-background font-bold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Container */}
        <div className="mt-2">
          {tab === "signin" ? (
            <CredentialsForm
              isModal
              onSuccess={handleAuthSuccess}
              onSwitchTab={(t) => setTab(t)}
            />
          ) : (
            <SignUpForm
              isModal
              redirectUrl="/dashboard/bookmarks"
              onSwitchTab={(t) => setTab(t)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
