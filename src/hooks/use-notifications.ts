import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNotifications } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export function useNotifications() {
  const fn = useServerFn(listNotifications);
  const qc = useQueryClient();
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fn(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const items = q.data ?? [];
  const unread = items.filter((n) => !n.read_at).length;
  return { items, unread, isLoading: q.isLoading };
}
