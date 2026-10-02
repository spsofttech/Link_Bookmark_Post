"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@karakeep/shared-react/trpc";

import { useSession } from "@/lib/auth/client";

/**
 * This component is used to address a confusion when the JWT token exists but the user no longer exists in the database.
 * So this component synchronously checks if the logged-in user is still valid and if not, signs out the user.
 */
export default function ValidAccountCheck() {
  const { data: session } = useSession();
  const api = useTRPC();
  const router = useRouter();
  const { error } = useQuery(
    api.users.whoami.queryOptions(undefined, {
      enabled: Boolean(session),
      retry: (_failureCount, error) => {
        if (error.data?.code === "UNAUTHORIZED") {
          return false;
        }
        return true;
      },
    }),
  );
  useEffect(() => {
    if (session && error?.data?.code === "UNAUTHORIZED") {
      router.push("/logout");
    }
  }, [session, error, router]);

  return null;
}
