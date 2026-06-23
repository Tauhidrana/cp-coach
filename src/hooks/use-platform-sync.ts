import { useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listMyPlatforms, syncAllPlatforms } from "@/lib/platforms.functions";
import { PLATFORMS, type PlatformId } from "@/lib/platforms/registry";

const ACTIVE_INTERVAL_MS = 60_000; // 60s while active
const IDLE_INTERVAL_MS = 5 * 60_000; // 5 min while idle
const IDLE_AFTER_MS = 2 * 60_000; // user idle after 2 min of no input

type PlatformRow = {
  platform: string;
  username: string;
  rating: number | null;
  max_rating: number | null;
  rank_label: string | null;
  problems_solved: number;
  contest_count: number;
  is_manual: boolean;
  last_synced_at: string | null;
};

/**
 * Smart live-sync for connected platforms.
 *
 * - Initial fetch from DB cached snapshot (renders instantly from cache).
 * - Background revalidation every 60s when user is active; 5min when idle;
 *   pauses entirely when the tab is hidden.
 * - Refetches on tab focus / network reconnect.
 * - Diff-based toasts when rating or solved count changes.
 */
export function usePlatformSync(opts: { autoPoll?: boolean } = {}) {
  const { autoPoll = true } = opts;
  const qc = useQueryClient();
  const listFn = useServerFn(listMyPlatforms);
  const syncAllFn = useServerFn(syncAllPlatforms);

  // Active/idle tracking via input events.
  const lastActiveRef = useRef<number>(Date.now());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => {
      lastActiveRef.current = Date.now();
    };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, bump));
  }, []);

  // The primary cached read — UI binds to ["platforms"].
  const query = useQuery<PlatformRow[]>({
    queryKey: ["platforms"],
    queryFn: () => listFn() as Promise<PlatformRow[]>,
    throwOnError: false,
    retry: 2,
    retryDelay: (i) => [1000, 2000, 5000][i] ?? 5000,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: "always",
  });

  // Previous snapshot for diff toasts (skip the first render).
  const prevRef = useRef<PlatformRow[] | null>(null);
  useEffect(() => {
    const next = query.data;
    if (!next) return;
    const prev = prevRef.current;
    if (prev) {
      for (const row of next) {
        const before = prev.find((p) => p.platform === row.platform);
        if (!before) continue;
        const meta = PLATFORMS[row.platform as PlatformId];
        const name = meta?.name ?? row.platform;
        if (
          typeof row.rating === "number" &&
          typeof before.rating === "number" &&
          row.rating !== before.rating
        ) {
          const delta = row.rating - before.rating;
          toast.success(
            `${delta > 0 ? "+" : ""}${delta} rating on ${name}`,
            { description: `New rating: ${row.rating}` },
          );
        }
        if (row.problems_solved > before.problems_solved) {
          const d = row.problems_solved - before.problems_solved;
          toast.success(`+${d} problem${d === 1 ? "" : "s"} solved on ${name}`);
        }
      }
    }
    prevRef.current = next;
  }, [query.data]);

  // Background sync mutation — silent by default (no toast on success).
  const sync = useMutation({
    mutationFn: ({ silent = true }: { silent?: boolean } = {}) =>
      syncAllFn().then((r) => ({ ...r, silent })),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["platforms"] });
      if (!res.silent) {
        const failed = res.results.filter((r) => !r.ok);
        if (failed.length === 0) {
          toast.success("Updated just now");
        } else {
          for (const f of failed) {
            const meta = PLATFORMS[f.platform as PlatformId];
            toast.error(`Unable to sync ${meta?.name ?? f.platform}`, {
              description: "Retrying automatically…",
            });
          }
        }
      }
    },
    onError: (e: Error) => toast.error(e.message || "Sync failed"),
  });

  const syncNow = useCallback(
    (silent = false) => sync.mutate({ silent }),
    [sync],
  );

  // Smart polling loop.
  useEffect(() => {
    if (!autoPoll || typeof window === "undefined") return;
    let timer: number | undefined;

    const tick = () => {
      if (document.hidden) return; // paused while hidden
      const idle = Date.now() - lastActiveRef.current > IDLE_AFTER_MS;
      const interval = idle ? IDLE_INTERVAL_MS : ACTIVE_INTERVAL_MS;
      const sinceLast = Date.now() - lastSyncMs.current;
      if (sinceLast >= interval) {
        lastSyncMs.current = Date.now();
        sync.mutate({ silent: true });
      }
    };

    const lastSyncMs = { current: Date.now() };
    timer = window.setInterval(tick, 15_000); // probe every 15s, throttle inside

    const onVisible = () => {
      if (!document.hidden) {
        // Resume immediately when tab returns.
        lastSyncMs.current = 0;
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // sync mutation is stable enough; depend on autoPoll only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPoll]);

  const lastSyncedAt = (query.data ?? [])
    .map((r) => r.last_synced_at)
    .filter((s): s is string => !!s)
    .sort()
    .pop();

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isSyncing: sync.isPending,
    lastSyncedAt: lastSyncedAt ?? null,
    syncNow,
  };
}

export function formatSyncTime(iso: string | null): string {
  if (!iso) return "Not synced yet";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 5) return "Updated just now";
  if (diff < 60) return `Updated ${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `Updated ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Updated ${h}h ago`;
  return `Updated ${Math.floor(h / 24)}d ago`;
}
