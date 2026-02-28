import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/client";

export function useRealTime(queryKeys: string[][], enabled: boolean = true) {
    const keysStr = JSON.stringify(queryKeys);

    useEffect(() => {
        if (!enabled) return;

        const channel = supabase
            .channel("reports-changes")
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "reports",
            }, (payload) => {
                console.log("Realtime event:", payload);
                const parsedKeys = JSON.parse(keysStr);
                parsedKeys.forEach((key: string[]) => {
                    queryClient.invalidateQueries({ queryKey: key });
                });
            })

            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [keysStr, enabled]);
}
