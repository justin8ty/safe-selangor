// IncidentCard.tsx
"use client";

import { Clock, MapPin, Calendar } from "lucide-react";

interface IncidentCardProps {
    type: string | null;
    description: string | null;
    district: string | null;
    state: string | null;
    time: string | null;
    isSelected?: boolean;
    onClick?: () => void;
}

function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function IncidentCard({
    type, description, district, state, time, isSelected, onClick
}: IncidentCardProps) {
    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-xl border cursor-pointer transition-colors ${isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-muted/50"
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded flex items-center gap-1.5 uppercase ${type === "violent"
                    ? "bg-red-500/15 text-red-500"
                    : type === "property"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${type === "violent"
                        ? "bg-red-500"
                        : type === "property"
                            ? "bg-amber-500"
                            : "bg-muted-foreground"
                        }`} />
                    {type ?? "Unknown"}
                </span>


                {time && (
                    <span
                        className="text-xs text-muted-foreground flex items-center gap-1"
                        title={new Date(time).toLocaleString()}
                    >
                        <Clock size={12} />
                        {formatRelativeTime(time)}
                    </span>
                )}
            </div>

            <p className="text-sm font-normal mb-1 line-clamp-1">{description}</p>

            {district && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <MapPin size={12} />
                    {district}
                </span>
            )}
        </div>
    );
}
