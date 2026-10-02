"use client";

import { useEffect, useState } from "react";
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
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { useTRPC } from "@karakeep/shared-react/trpc";
import {
  isMobileAppRedirect,
  validateRedirectUrl,
} from "@karakeep/shared/utils/redirectUrl";

export default function VerifyEmailPage() {
  const api = useTRPC();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const redirectUrl =
    validateRedirectUrl(searchParams.get("redirectUrl")) ?? "/";

  const verifyEmailMutation = useMutation(
    api.users.verifyEmail.mutationOptions({
      onSuccess: () => {
        setStatus("success");
        if (isMobileAppRedirect(redirectUrl)) {
          setMessage(
            "Your email has been successfully verified! Redirecting to the app...",
          );
          // Redirect to mobile app after a brief delay
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          setMessage(
            "Your email has been successfully verified! You can now sign in.",
          );
        }
      },
      onError: (error) => {
        setStatus("error");
        setMessage(
          error.message ||
            "Failed to verify email. The link may be invalid or expired.",
        );
      },
    }),
  );

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

  const isMobileRedirect = isMobileAppRedirect(redirectUrl);

  useEffect(() => {
    if (token && email) {
      verifyEmailMutation.mutate({ token, email });
    } else {
      setStatus("error");
      setMessage("Invalid verification link. Missing token or email.");
    }
  }, [token, email]);

  const handleResendEmail = () => {
    if (email) {
      resendEmailMutation.mutate({ email, redirectUrl });
    }
  };

  const handleSignIn = () => {
    if (isMobileRedirect) {
      window.location.href = redirectUrl;
    } else if (redirectUrl !== "/") {
      router.push(`/signin?redirectUrl=${encodeURIComponent(redirectUrl)}`);
    } else {
      router.push("/signin");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 font-sans text-slate-100 sm:px-6 lg:px-8">
      {/* Glowing Ambient Background Elements */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[120px]" />

      <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-amber-500/20 bg-slate-900/80 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
        <CardHeader className="pb-4 pt-8 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
            Email Verification
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-400">
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Email verified successfully!"}
            {status === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-8">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
              <p className="text-sm text-slate-400">
                Verifying secure token...
              </p>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="flex items-center justify-center py-2">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                <AlertDescription className="text-center text-sm">
                  {message}
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleSignIn}
                className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/25"
              >
                {isMobileRedirect ? "Open App" : "Sign In"}
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex items-center justify-center py-2">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                  <XCircle className="h-8 w-8" />
                </div>
              </div>
              <Alert
                variant="destructive"
                className="border-rose-500/30 bg-rose-500/10 text-rose-300"
              >
                <AlertDescription className="text-center text-sm">
                  {message}
                </AlertDescription>
              </Alert>
              {email && (
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
                    onClick={handleSignIn}
                    variant="ghost"
                    className="w-full text-slate-400 hover:bg-transparent hover:text-amber-400"
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
