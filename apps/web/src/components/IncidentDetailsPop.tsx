"use client";

import { X, MapPin, Clock, ImageIcon, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface Incident {
    type: string;
    location: string;
    description: string;
    time: string;
    mediaKey: string | null;
}

interface IncidentDetailsPopProps {
    open: boolean;
    onClose: () => void;
    incident: Incident | null;
}

function getMediaUrl(storageKey: string): string {
    const { data } = supabase.storage
        .from("reports")
        .getPublicUrl(storageKey);
    return data.publicUrl;
}

export default function IncidentDetailsPop({ open, onClose, incident }: IncidentDetailsPopProps) {
    if (!open || !incident) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col">
                <div className="relative p-6 pb-3">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded flex items-center gap-1.5 uppercase ${incident.type === "violent"
                            ? "bg-red-500/15 text-red-500"
                            : incident.type === "property"
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-muted text-muted-foreground"
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${incident.type === "violent"
                                ? "bg-red-500"
                                : incident.type === "property"
                                    ? "bg-amber-500"
                                    : "bg-muted-foreground"
                                }`} />
                            {incident.type ?? "Unknown"}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-muted text-muted-foreground border border-border">
                            Community Report
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{incident.time}</span>
                        </div>
                    </div>


                    {/* Location & Coordinates Row */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span>{incident.location}</span>
                        {/* {incident.coordinates && (
                            <>
                                <span className="opacity-50">•</span>
                                <span className="font-mono text-xs">Lat: {incident.coordinates.lat.toFixed(4)}, Lng: {incident.coordinates.lng.toFixed(4)}</span>
                            </>
                        )} */}
                    </div>
                </div>

                <div className="p-6 pt-1 flex flex-col gap-5">
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <ShieldAlert size={14} /> User Description
                        </h4>
                        <div className="bg-background p-4">
                            <p className="text-sm text-foreground leading-relaxed">
                                {incident.description}
                            </p>
                        </div>
                    </div>

                    {/* User Uploaded Image */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
                            <ImageIcon size={14} /> User Uploaded Image
                        </h4>
                        {incident.mediaKey ? (
                            <img
                                src={getMediaUrl(incident.mediaKey)}
                                alt="Evidence"
                                className="w-full rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(getMediaUrl(incident.mediaKey!), "_blank")}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No image attached</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
