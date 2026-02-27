"use client";

import { Clock, MapPin, Landmark } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface IncidentCardProps {
    type: string | null;
    description: string | null;
    district: string | null;
    state: string | null;
    time: string | null;
    landmarkLabel?: string | null;
    isSelected?: boolean;
    onClick?: () => void;
}

export default function IncidentCard({
    type, description, district, state, time, landmarkLabel, isSelected, onClick
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

            <p className="text-sm font-normal mb-1 line-clamp-1">{description ?? "No description provided."}</p>

            {district && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <MapPin size={12} />
                    {district}{state ? `, ${state}` : ""}
                </span>
            )}

            {landmarkLabel && (
                <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1 line-clamp-1">
                    <Landmark size={12} />
                    Near {landmarkLabel}
                </span>
            )}
        </div>
    );
}
