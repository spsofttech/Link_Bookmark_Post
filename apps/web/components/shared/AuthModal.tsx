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
import KarakeepLogo from "@/components/KarakeepIcon";
import { toast } from "sonner";
import { Lock } from "lucide-react";

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
    toast.success("Successfully logged in! Reloading workspace...");
    onClose();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl p-6 sm:p-8">
        <DialogHeader className="flex flex-col items-center justify-center space-y-2 text-center">
          <KarakeepLogo height={52} />
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {tab === "signin"
              ? "Sign in to Save Content"
              : "Create your Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {message ||
              "Unlock unlimited post previews, bookmark saving, and AI auto-tagging."}
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Lock className="size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`flex-1 rounded-lg py-2 transition-all ${
              tab === "signin"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 rounded-lg py-2 transition-all ${
              tab === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Container */}
        <div className="mt-2">
          {tab === "signin" ? (
            <CredentialsForm onSuccess={handleAuthSuccess} />
          ) : (
            <SignUpForm redirectUrl="/dashboard/bookmarks" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
