import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySettings, updateMySettings } from "@/lib/settings.functions";
import { useAuth } from "@/lib/use-auth";

export type UserSettings = Awaited<ReturnType<typeof getMySettings>>;

export function useSettings() {
  const { user } = useAuth();
  const getFn = useServerFn(getMySettings);
  const updFn = useServerFn(updateMySettings);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => getFn(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const update = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => updFn({ data: patch as never }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  return { settings: q.data, isLoading: q.isLoading, update };
}

export function resolveLanguage(pref: "auto" | "en" | "bn" | undefined | null): "en" | "bn" {
  if (pref === "bn") return "bn";
  if (pref === "en") return "en";
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("bn")) return "bn";
  return "en";
}
