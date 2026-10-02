import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/server/auth";
import { Info, Sparkles } from "lucide-react";

import serverConfig from "@karakeep/shared/config";

import CredentialsForm from "./CredentialsForm";
import OAuthAutoRedirect from "./OAuthAutoRedirect";
import SignInProviderButton from "./SignInProviderButton";

export default async function SignInForm() {
  const providers = authOptions.providers;
  let providerValues;
  if (providers) {
    providerValues = Object.values(providers).filter(
      // Credentials are handled manually by the sign in form
      (p) => p.id != "credentials",
    );
  }

  return (
    <div className="w-full">
      {/* Auto-redirect to OAuth provider if configured */}
      {providerValues && providerValues.length > 0 && (
        <OAuthAutoRedirect oauthProviderId={providerValues[0].id} />
      )}
      <Card className="w-full overflow-hidden rounded-2xl border-amber-500/20 bg-slate-900/80 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
        <CardHeader className="pb-4 pt-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="size-3.5" />
            <span>Save Content Workspace</span>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-400">
            Sign in to access your AI templates & bookmark assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-8">
          {serverConfig.demoMode && (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-300">
              <Info className="h-4 w-4 text-amber-400" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold text-amber-200">
                    Demo Mode Active
                  </p>
                  <p>Email: {serverConfig.demoMode.email}</p>
                  <p>Password: {serverConfig.demoMode.password}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <CredentialsForm />

          {providerValues && providerValues.length > 0 && (
            <>
              <div className="my-4 flex w-full items-center">
                <div className="flex-1 grow border-t border-slate-800"></div>
                <span className="bg-slate-900 px-3 text-xs uppercase tracking-widest text-slate-500">
                  Or continue with
                </span>
                <div className="flex-1 grow border-t border-slate-800"></div>
              </div>
              <div className="space-y-2">
                {providerValues.map((provider) => (
                  <SignInProviderButton
                    key={provider.id}
                    provider={{ id: provider.id, name: provider.name }}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
