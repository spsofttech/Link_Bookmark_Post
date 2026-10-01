import { Suspense } from "react";
import ErrorFallback from "@/components/dashboard/ErrorFallback";
import DemoModeBanner from "@/components/DemoModeBanner";
import LoadingSpinner from "@/components/ui/spinner";
import ValidAccountCheck from "@/components/utils/ValidAccountCheck";
import { ErrorBoundary } from "react-error-boundary";

import serverConfig from "@karakeep/shared/config";

export default function SidebarLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  mobileSidebar?: React.ReactNode;
  sidebar?: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      <ValidAccountCheck />
      <main className="flex h-full w-full flex-1 flex-col overflow-hidden">
        {serverConfig.demoMode && <DemoModeBanner />}
        {modal}
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
