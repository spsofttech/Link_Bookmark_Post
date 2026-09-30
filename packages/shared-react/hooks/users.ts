import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../trpc";

type TRPCApi = ReturnType<typeof useTRPC>;

export function useUpdateUserSettings(
  opts?: Parameters<TRPCApi["users"]["updateSettings"]["mutationOptions"]>[0],
) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    api.users.updateSettings.mutationOptions({
      ...opts,
      onSuccess: (res, req, meta, context) => {
        queryClient.invalidateQueries(api.users.settings.pathFilter());
        return opts?.onSuccess?.(res, req, meta, context);
      },
    }),
  );
}

export function useUpdateUserAvatar(
  opts?: Parameters<TRPCApi["users"]["updateAvatar"]["mutationOptions"]>[0],
) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    api.users.updateAvatar.mutationOptions({
      ...opts,
      onSuccess: (res, req, meta, context) => {
        queryClient.invalidateQueries(api.users.whoami.pathFilter());
        return opts?.onSuccess?.(res, req, meta, context);
      },
    }),
  );
}

export function useDeleteAccount(
  opts?: Parameters<TRPCApi["users"]["deleteAccount"]["mutationOptions"]>[0],
) {
  const api = useTRPC();
  return useMutation(api.users.deleteAccount.mutationOptions(opts));
}

export function useClearAllData(
  opts?: Parameters<TRPCApi["users"]["clearAllData"]["mutationOptions"]>[0],
) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    api.users.clearAllData.mutationOptions({
      ...opts,
      onSuccess: (res, req, meta, context) => {
        queryClient.invalidateQueries();
        return opts?.onSuccess?.(res, req, meta, context);
      },
    }),
  );
}

export function useWhoAmI() {
  const api = useTRPC();
  return useQuery(api.users.whoami.queryOptions());
}

export function useSupabaseStatus() {
  const api = useTRPC();
  return useQuery(api.users.getSupabaseStatus.queryOptions());
}

export function useToggleSupabaseSync(
  opts?: Parameters<
    TRPCApi["users"]["toggleSupabaseSync"]["mutationOptions"]
  >[0],
) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    api.users.toggleSupabaseSync.mutationOptions({
      ...opts,
      onSuccess: (res, req, meta, context) => {
        queryClient.invalidateQueries({
          queryKey: api.users.getSupabaseStatus.queryKey(),
        });
        return opts?.onSuccess?.(res, req, meta, context);
      },
    }),
  );
}

export function useSyncToSupabaseNow(
  opts?: Parameters<
    TRPCApi["users"]["syncToSupabaseNow"]["mutationOptions"]
  >[0],
) {
  const api = useTRPC();
  return useMutation(api.users.syncToSupabaseNow.mutationOptions(opts));
}
