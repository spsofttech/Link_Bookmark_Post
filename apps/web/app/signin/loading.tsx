import { Skeleton } from "@/components/ui/skeleton";

export default function SignInLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <Skeleton className="h-20 w-20 rounded-xl" />
        </div>
        {/* Card skeleton */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 space-y-2 text-center">
            <Skeleton className="mx-auto h-7 w-36" />
            <Skeleton className="mx-auto h-4 w-52" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
