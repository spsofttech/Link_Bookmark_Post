"use client";

import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Turnstile } from "@marsidev/react-turnstile";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { AlertCircle, Eye, EyeOff, Sparkles, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTRPC } from "@karakeep/shared-react/trpc";
import { zSignUpSchema } from "@karakeep/shared/types/users";
import { isMobileAppRedirect } from "@karakeep/shared/utils/redirectUrl";

const VERIFY_EMAIL_ERROR = "Please verify your email address before signing in";

interface SignUpFormProps {
  redirectUrl: string;
}

export default function SignUpForm({ redirectUrl }: SignUpFormProps) {
  const api = useTRPC();
  const form = useForm<z.infer<typeof zSignUpSchema>>({
    resolver: zodResolver(zSignUpSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      turnstileToken: "",
    },
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const clientConfig = useClientConfig();
  const turnstileSiteKey = clientConfig.turnstile?.siteKey;
  const turnstileRef = useRef<TurnstileInstance>(null);

  const createUserMutation = useMutation(api.users.create.mutationOptions());

  if (
    clientConfig.auth.disableSignups ||
    clientConfig.auth.disablePasswordAuth
  ) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Sign Up Unavailable
          </CardTitle>
          <CardDescription>
            Account registration is currently disabled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Alert>
              <UserX className="h-4 w-4" />
              <AlertDescription>
                Signups are currently disabled. Please contact an administrator
                for access.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/signin">Back to Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden rounded-2xl border-amber-500/20 bg-slate-900/80 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
      <CardHeader className="pb-4 pt-8 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="size-3.5" />
          <span>Join Save Content Platform</span>
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
          Create Your Account
        </CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-400">
          Join Save Content to start organizing your AI templates & bookmarks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (value) => {
              if (turnstileSiteKey && !value.turnstileToken) {
                form.setError("turnstileToken", {
                  type: "manual",
                  message: "Please complete the verification challenge",
                });
                return;
              }
              form.clearErrors("turnstileToken");
              try {
                await createUserMutation.mutateAsync({
                  ...value,
                  redirectUrl,
                });
              } catch (e: unknown) {
                const err = e as { message?: string };
                const msg =
                  err?.message ||
                  (e instanceof TRPCClientError
                    ? e.message
                    : "Failed to create account. Please try again.");
                setErrorMessage(msg);
                // Reset turnstile widget on error to get a new token
                if (turnstileSiteKey) {
                  turnstileRef.current?.reset();
                  form.setValue("turnstileToken", "");
                }
                return;
              }
              const resp = await signIn("credentials", {
                redirect: false,
                email: value.email.trim(),
                password: value.password,
              });
              if (!resp || !resp.ok || resp.error) {
                if (resp?.error === VERIFY_EMAIL_ERROR) {
                  router.replace(
                    `/check-email?email=${encodeURIComponent(value.email.trim())}&redirectUrl=${encodeURIComponent(redirectUrl)}`,
                  );
                } else {
                  setErrorMessage(
                    resp?.error ?? "Hit an unexpected error while signing in",
                  );
                }
                // Reset turnstile widget on error to get a new token
                if (turnstileSiteKey) {
                  turnstileRef.current?.reset();
                  form.setValue("turnstileToken", "");
                }
                return;
              }
              if (isMobileAppRedirect(redirectUrl)) {
                window.location.href = redirectUrl;
              } else {
                window.location.href = redirectUrl || "/dashboard/bookmarks";
              }
            })}
            className="space-y-4"
          >
            {errorMessage && (
              <Alert
                variant="destructive"
                className="border-rose-500/30 bg-rose-500/10 text-rose-300"
              >
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Alex Morgan"
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
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
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
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-11 rounded-xl border-slate-800 bg-slate-950/80 pl-4 pr-10 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                        tabIndex={-1}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
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

            {turnstileSiteKey && (
              <FormField
                control={form.control}
                name="turnstileToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Verification
                    </FormLabel>
                    <FormControl>
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={turnstileSiteKey}
                        onSuccess={(token) => {
                          field.onChange(token);
                          form.clearErrors("turnstileToken");
                        }}
                        onExpire={() => field.onChange("")}
                        onError={() => {
                          field.onChange("");
                          form.setError("turnstileToken", {
                            type: "manual",
                            message:
                              "Verification failed, please reload the challenge",
                          });
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />
            )}

            <ActionButton
              type="submit"
              loading={
                form.formState.isSubmitting || createUserMutation.isPending
              }
              className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.01] hover:from-amber-400 hover:to-amber-300 active:scale-[0.99]"
            >
              Sign up
            </ActionButton>

            {(clientConfig.legal.termsOfServiceUrl ||
              clientConfig.legal.privacyPolicyUrl) && (
              <p className="text-center text-xs text-slate-400">
                By clicking on &apos;Sign up&apos; above, you are agreeing to
                the{" "}
                {clientConfig.legal.termsOfServiceUrl && (
                  <Link
                    href={clientConfig.legal.termsOfServiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Terms of Service
                  </Link>
                )}
                {clientConfig.legal.termsOfServiceUrl &&
                  clientConfig.legal.privacyPolicyUrl &&
                  " and "}
                {clientConfig.legal.privacyPolicyUrl && (
                  <Link
                    href={clientConfig.legal.privacyPolicyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Privacy Policy
                  </Link>
                )}
                .
              </p>
            )}
          </form>
        </Form>

        <div className="pt-2 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-amber-400 transition-colors hover:text-amber-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
