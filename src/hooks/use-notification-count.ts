"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCount(0); return; }

      const { count: unread } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setCount(unread ?? 0);
    }

    fetchCount();

    // Set up realtime subscription
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel("notification-count")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchCount()
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchCount()
        )
        .subscribe();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCount();
    });

    return () => {
      subscription.unsubscribe();
      channel?.unsubscribe();
    };
  }, []);

  return count;
}
