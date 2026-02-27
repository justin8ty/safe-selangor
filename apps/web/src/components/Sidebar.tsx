"use client";

import { Info } from "lucide-react";
import { useState, useEffect } from "react";
import IncidentDetailsPop, { Incident } from "./IncidentDetailsPop";
import IncidentCard from "./IncidentCard";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/services";
import { FeedItem } from "@/types";
import { supabase } from "@/lib/supabase";

const crimeIndex = 52000;

export default function Sidebar() {
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const { data, isLoading } = useQuery({
        queryKey: ["feed"],
        queryFn: getFeed,
    });

    const incidents: FeedItem[] = data?.items ?? [];
    console.log("Feed data:", data);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            console.log("Session:", data.session);
            console.log("User:", data.session?.user);
            console.log("Token:", data.session?.access_token);
        });
    }, []);

    return (
        <div className="flex flex-col p-6 gap-6 h-full min-w-[300px]">

            <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Current Crime Index
                    <Info className="text-muted-foreground cursor-help" size={14} />
                </div>
                <p className="text-3xl font-bold text-primary mt-2">
                    {crimeIndex.toLocaleString()}
                </p>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {incidents.map((incident) => (
                    <IncidentCard
                        key={incident.reportId}
                        type={incident.type}
                        description={incident.description}
                        district={incident.district}
                        state={incident.state}
                        time={incident.createdAt}
                    />
                ))}
            </div>

            <IncidentDetailsPop
                open={!!selectedIncident}
                onClose={() => setSelectedIncident(null)}
                incident={selectedIncident}
            />
        </div>
    );
}
