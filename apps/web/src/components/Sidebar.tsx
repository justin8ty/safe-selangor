'use client';

import { Info, Clock, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import IncidentDetailsPop, { Incident } from "./IncidentDetailsPop";

const crimeIndex = 52000;

const incidents: Incident[] = [
    {
        title: "Armed Robbery",
        reportType: "OFFICIAL NEWS",
        location: "Kuala Lumpur City Center",
        description: "Armed robbery occurred at a Maybank branch. Two suspects fled the scene via a motorcycle.",
        time: "30 min ago",
        source: "The Star News",
        sourceUrl: "#",
        color: "bg-red-500",
        coordinates: { lat: 3.1412, lng: 101.6865 }
    },
    {
        title: "Suspicious Activity",
        reportType: "COMMUNITY REPORT",
        location: "Sector 4 - Alleyway",
        description: "Two individuals loitering near the server farm entrance wearing masks.",
        time: "10m ago",
        source: "Community App User",
        sourceUrl: "#",
        color: "bg-amber-400",
        coordinates: { lat: 54.0000, lng: 46.0000 }
    }
]

const crimeTrend = {
    period: "Last 30 hours",
    change: "20%",
    trend: "up"
}

export default function Sidebar() {
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

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
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">Recent Incidents</h2>
                    <select className="text-xs border border-border rounded-md px-2 py-1 bg-background text-muted-foreground">
                        <option>Last 24 Hours</option>
                        <option>Last 7 Days</option>
                    </select>
                </div>

                {incidents.map((incident, i) => (
                    <div
                        key={i}
                        onClick={() => setSelectedIncident(incident)}
                        className="rounded-lg border border-border p-4 flex flex-col gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${incident.color}`} />
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {incident.title}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} />
                                {incident.time}
                            </span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-1">{incident.description}</p>
                        <Link
                            href={incident.sourceUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary self-end hover:underline flex items-center gap-1"
                        >
                            {incident.source} <ExternalLink size={12} />
                        </Link>
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