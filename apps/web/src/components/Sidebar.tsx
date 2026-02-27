"use client";

import { Info } from "lucide-react";
import { useState, useEffect } from "react";
import IncidentDetailsPop, { Incident } from "./IncidentDetailsPop";
import IncidentCard from "./IncidentCard";
import { supabase } from "@/lib/supabase";
import { FeedItem } from "@/types";

const crimeIndex = 52000;

interface SidebarProps {
    feedItems: FeedItem[];
}

export default function Sidebar({ feedItems }: SidebarProps) {
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const incidents = feedItems;

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
                        landmarkLabel={incident.landmarkLabel ?? null}
                        time={incident.createdAt}
                        onClick={() => setSelectedIncident({
                            type: incident.type || "unknown",
                            location: `${incident.district ?? "Unknown"}${incident.state ? `, ${incident.state}` : ""}`,
                            description: incident.description || "No description provided.",
                            time: incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "",
                            mediaKey: incident.mediaKey,
                            mediaKeys: incident.mediaKeys ?? (incident.mediaKey ? [incident.mediaKey] : []),
                            landmarkLabel: incident.landmarkLabel ?? null,
                        })}

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
