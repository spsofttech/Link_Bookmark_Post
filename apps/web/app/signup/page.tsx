import { redirect } from "next/navigation";
import SignUpForm from "@/components/signup/SignUpForm";
import { getServerAuthSession } from "@/server/auth";

import {
  isMobileAppRedirect,
  validateRedirectUrl,
} from "@karakeep/shared/utils/redirectUrl";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectUrl?: string; skipSessionRedirect?: string }>;
}) {
  const session = await getServerAuthSession();
  const { redirectUrl: rawRedirectUrl, skipSessionRedirect } =
    await searchParams;
  const redirectUrl = validateRedirectUrl(rawRedirectUrl) ?? "/";
  const shouldSkipSessionRedirect =
    isMobileAppRedirect(redirectUrl) && skipSessionRedirect === "1";

  if (session && !shouldSkipSessionRedirect) {
    redirect(redirectUrl);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 font-sans text-slate-100 sm:px-6 lg:px-8">
      {/* Glowing Ambient Background Elements */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <SignUpForm redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
