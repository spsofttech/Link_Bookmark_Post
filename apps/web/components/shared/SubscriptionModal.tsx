"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Crown, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  message,
}: SubscriptionModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = (planId: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        localStorage.setItem("karakeep_user_plan", planId);
        localStorage.setItem("karakeep_logged_in", "true");
        localStorage.setItem("karakeep_user_role", "Pro Member");
      } catch {
        // Ignore storage error
      }
      setIsProcessing(false);
      toast.success(
        `Successfully upgraded to ${planId.toUpperCase()} Pro Plan!`,
      );
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <DialogHeader className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-inner">
            <Crown className="size-6 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">
            Upgrade Your Karakeep Workspace
          </DialogTitle>
          <DialogDescription className="max-w-md text-xs text-muted-foreground">
            {message ||
              "Unlock unlimited post previews, custom AI prompts, priority support, and team collaboration."}
          </DialogDescription>
        </DialogHeader>

        {/* Billing toggle */}
        <div className="my-4 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-semibold ${billingCycle === "monthly" ? "font-bold text-foreground" : "text-muted-foreground"}`}
          >
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-amber-500 transition-colors duration-200 ease-in-out"
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold ${billingCycle === "yearly" ? "font-bold text-foreground" : "text-muted-foreground"}`}
          >
            Yearly Billing
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              Save 20%
            </span>
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Free Tier */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-muted/20 p-5 transition-all hover:border-amber-500/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Starter Free
                </span>
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  Current Plan
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground">
                  $0
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-500" />
                  <span>3 Post Previews per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-500" />
                  <span>Standard Category Tagging</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-500" />
                  <span>Community Support</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-xl border border-border bg-muted py-2.5 text-xs font-bold text-muted-foreground"
            >
              Default Plan
            </button>
          </div>

          {/* Pro Member Tier */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-amber-500 bg-amber-500/5 p-5 shadow-lg shadow-amber-500/10">
            <div className="absolute -top-3 right-4 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
              Most Popular
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-amber-500" />
                <span className="text-sm font-bold text-foreground">
                  Pro Member
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground">
                  {billingCycle === "yearly" ? "$9.99" : "$12.99"}
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs font-medium text-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-500" />
                  <span>Unlimited Post & Embed Previews</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-500" />
                  <span>AI Auto-Summarization & Custom Prompts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-500" />
                  <span>Hide Admin Default Posts Option</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-500" />
                  <span>Priority 24/7 Support Ticketing</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleUpgrade("pro")}
              disabled={isProcessing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
            >
              <span>
                {isProcessing ? "Upgrading..." : "Upgrade to Pro Member"}
              </span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
