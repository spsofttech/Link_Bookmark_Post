"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { AlertCircle, CheckCircle, Eye, EyeOff, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTRPC } from "@karakeep/shared-react/trpc";
import { zResetPasswordSchema } from "@karakeep/shared/types/users";

const resetPasswordSchema = z
  .object({
    confirmPassword: z.string(),
  })
  .extend(zResetPasswordSchema.pick({ newPassword: true }).shape)
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const api = useTRPC();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMutation = useMutation(
    api.users.resetPassword.mutationOptions(),
  );

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setErrorMessage("");
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword: values.newPassword,
      });
      setIsSuccess(true);
    } catch (error) {
      if (error instanceof TRPCClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <Card className="w-full overflow-hidden rounded-2xl border-amber-500/20 bg-slate-900/80 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
      <CardHeader className="pb-4 pt-8 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="size-3.5" />
          <span>Security Reset</span>
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
          {isSuccess ? "Password Reset Successful" : "Reset Your Password"}
        </CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-400">
          {isSuccess
            ? "Your password has been successfully reset. You can now sign in with your new password."
            : "Enter your new password below to complete security recovery."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-8">
        {isSuccess ? (
          <>
            <div className="flex items-center justify-center py-2">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <AlertDescription className="text-center text-sm">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </AlertDescription>
            </Alert>
            <ActionButton
              loading={false}
              onClick={() => router.push("/signin")}
              className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/25"
            >
              Go to Sign In
            </ActionButton>
          </>
        ) : (
          <>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
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
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-11 rounded-xl border-slate-800 bg-slate-950/80 pl-4 pr-10 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                            tabIndex={-1}
                            aria-label={
                              showNewPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showNewPassword ? (
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
                        Confirm New Password
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

                <ActionButton
                  type="submit"
                  loading={form.formState.isSubmitting}
                  className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.01] hover:from-amber-400 hover:to-amber-300 active:scale-[0.99]"
                >
                  Reset Password
                </ActionButton>
              </form>
            </Form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => router.push("/signin")}
                className="text-sm font-semibold text-amber-400 transition-colors hover:text-amber-300 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
