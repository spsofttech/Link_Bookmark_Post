"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import KarakeepLogo from "@/components/KarakeepIcon";
import { Loader2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth/client";
import { useClientConfig } from "@/lib/clientConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SIGNIN_FAILED = "Incorrect email or password";
const OAUTH_FAILED = "OAuth login failed: ";

const VERIFY_EMAIL_ERROR = "Please verify your email address before signing in";

export default function CredentialsForm() {
  const [signinError, setSigninError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientConfig = useClientConfig();

  const oAuthError = searchParams.get("error");
  if (oAuthError && !signinError) {
    setSigninError(`${OAUTH_FAILED} ${oAuthError}`);
  }

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (clientConfig.auth.disablePasswordAuth) {
    return (
      <div className="space-y-4">
        {signinError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{signinError}</AlertTitle>
          </Alert>
        )}
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>
            Password authentication is currently disabled.
          </AlertTitle>
        </Alert>
      </div>
    );
  }

  const isPending = isLoading || form.formState.isSubmitting || isRedirecting;

  return (
    <div className="space-y-6">
      {/* Full-screen redirect loader — shown after successful login */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm">
          <KarakeepLogo height={64} />
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-semibold text-foreground">
              Signing you in...
            </span>
          </div>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          </div>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (value) => {
            setSigninError("");
            setIsLoading(true);
            try {
              const resp = await signIn("credentials", {
                redirect: false,
                email: value.email.trim(),
                password: value.password,
              });
              if (!resp || !resp?.ok || resp.error) {
                setIsLoading(false);
                if (resp?.error === "CredentialsSignin") {
                  setSigninError(SIGNIN_FAILED);
                } else if (resp?.error === VERIFY_EMAIL_ERROR) {
                  router.replace(
                    `/check-email?email=${encodeURIComponent(value.email.trim())}`,
                  );
                } else {
                  setSigninError(resp?.error ?? SIGNIN_FAILED);
                }
                return;
              }
              // Show branded loading overlay and navigate with fresh session cookies
              setIsRedirecting(true);
              window.location.href = "/dashboard/bookmarks";
            } catch (err) {
              setIsLoading(false);
              setSigninError(
                err instanceof Error ? err.message : SIGNIN_FAILED,
              );
            }
          })}
          className="space-y-4"
        >
          {signinError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{signinError}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="name@example.com"
                    className="h-11 rounded-xl border-slate-800 bg-slate-950/80 px-4 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-amber-400 transition-colors hover:text-amber-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 rounded-xl border-slate-800 bg-slate-950/80 pl-4 pr-10 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <ActionButton
            ignoreDemoMode
            type="submit"
            loading={isPending}
            disabled={isPending}
            className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.01] hover:from-amber-400 hover:to-amber-300 active:scale-[0.99]"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>Signing in...</span>
              </span>
            ) : (
              "Sign In"
            )}
          </ActionButton>
        </form>
      </Form>

      <div className="pt-2 text-center">
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-amber-400 transition-colors hover:text-amber-300 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
