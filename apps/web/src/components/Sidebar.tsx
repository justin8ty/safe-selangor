"use client";

import { Info, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import IncidentDetailsPop, { Incident } from "./IncidentDetailsPop";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/services";
import { FeedItem } from "@/types";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

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

            <div className="flex-1 flex flex-col gap-3">
                {incidents.map((incident) => (
                    <div
                        // TODO: onclick
                        key={incident.reportId}
                        className="rounded-lg border border-border p-4 flex flex-col gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {incident.category}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} />
                                {incident.createdAt ? new Date(incident.createdAt).toLocaleDateString() : ""}
                            </span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-1">{incident.description}</p>
                        <span className="text-xs text-muted-foreground self-end">
                            {incident.district}, {incident.state}
                        </span>
                        {/* <Link
                            href={incident.sourceUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary self-end hover:underline flex items-center gap-1"
                        >
                            {incident.source} <ExternalLink size={12} />
                        </Link> */}
                    </div>
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