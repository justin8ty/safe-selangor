import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/client";

export function useRealTime(queryKeys: string[][]) {
    useEffect(() => {
        const channel = supabase
            .channel("reports-changes")
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "reports",
            }, (payload) => {
                console.log("Realtime event:", payload);
                queryKeys.forEach(key => {
                    queryClient.invalidateQueries({ queryKey: key });
                });
            })

            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
}
