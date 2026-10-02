"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Mail, Sparkles } from "lucide-react";

import { useTRPC } from "@karakeep/shared-react/trpc";
import { validateRedirectUrl } from "@karakeep/shared/utils/redirectUrl";

export default function CheckEmailPage() {
  const api = useTRPC();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("");

  const email = searchParams.get("email");
  const redirectUrl =
    validateRedirectUrl(searchParams.get("redirectUrl")) ?? "/";

  const resendEmailMutation = useMutation(
    api.users.resendVerificationEmail.mutationOptions({
      onSuccess: () => {
        setMessage(
          "A new verification email has been sent to your email address.",
        );
      },
      onError: (error) => {
        setMessage(error.message || "Failed to resend verification email.");
      },
    }),
  );

  const handleResendEmail = () => {
    if (email) {
      resendEmailMutation.mutate({ email, redirectUrl });
    }
  };

  const handleBackToSignIn = () => {
    router.push("/signin");
  };

  if (!email) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 font-sans text-slate-100 sm:px-6 lg:px-8">
        <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-amber-500/20 bg-slate-900/80 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
          <CardHeader className="pb-4 pt-8 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Invalid Request
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-400">
              No email address provided. Please try signing up again.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <Button
              onClick={handleBackToSignIn}
              className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-bold text-slate-950"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 font-sans text-slate-100 sm:px-6 lg:px-8">
      {/* Glowing Ambient Background Elements */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[120px]" />

      <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-amber-500/20 bg-slate-900/80 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
        <CardHeader className="pb-4 pt-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="size-3.5" />
            <span>Verification Sent</span>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
            Check Your Email
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-400">
            We&apos;ve sent a verification link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-8">
          <div className="flex items-center justify-center py-2">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Mail className="h-8 w-8" />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Verification email sent to
            </p>
            <p className="text-base font-bold text-amber-400">{email}</p>
            <p className="pt-1 text-xs leading-relaxed text-slate-400">
              Click the link in your email inbox to verify your account and
              access your AI templates & bookmarks workspace.
            </p>
          </div>

          {message && (
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <AlertDescription className="text-center text-sm">
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="h-11 w-full rounded-xl border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-900 hover:text-white"
              disabled={resendEmailMutation.isPending}
            >
              {resendEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-400" />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>
            <Button
              onClick={handleBackToSignIn}
              variant="ghost"
              className="w-full text-slate-400 hover:bg-transparent hover:text-amber-400"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
