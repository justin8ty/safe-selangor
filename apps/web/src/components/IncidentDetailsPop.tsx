"use client";

import { X, MapPin, Clock, ExternalLink, ShieldAlert, Share2, Map as MapIcon } from "lucide-react";

export interface Incident {
    title: string;
    reportType: "COMMUNITY REPORT" | "OFFICIAL NEWS";
    location: string;
    description: string;
    time: string;
    source: string;
    sourceUrl: string;
    color: string;
    coordinates?: { lat: number; lng: number };
}

interface IncidentDetailsPopProps {
    open: boolean;
    onClose: () => void;
    incident: Incident | null;
}

export default function IncidentDetailsPop({ open, onClose, incident }: IncidentDetailsPopProps) {
    if (!open || !incident) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col">

                <div className="relative p-6 pb-2">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Badge and Time row */}
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded text-white ${incident.reportType === 'COMMUNITY REPORT' ? 'bg-purple-900/80 text-purple-200 border border-purple-700/50' : 'bg-blue-900/80 text-blue-200 border border-blue-700/50'}`}>
                            {incident.reportType}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{incident.time}</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight pr-6">
                        {incident.title}
                    </h2>

                    {/* Location & Coordinates Row */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span>{incident.location}</span>
                        {incident.coordinates && (
                            <>
                                <span className="opacity-50">•</span>
                                <span className="font-mono text-xs">Lat: {incident.coordinates.lat.toFixed(4)}, Lng: {incident.coordinates.lng.toFixed(4)}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 pt-2 flex flex-col gap-6">

                    {/* Description Card */}
                    <div className="bg-background border border-border/50 rounded-xl p-5 shadow-sm">
                        <p className="text-sm text-foreground leading-relaxed">
                            {incident.description}
                        </p>
                    </div>

                    {/* Verification & Source */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            Verification details
                        </h3>
                        <div className="bg-background rounded-lg p-4 border border-border text-sm flex justify-between items-center">
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Source</span>
                                <span className="font-medium text-foreground">{incident.source}</span>
                            </div>
                            <a
                                href={incident.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors font-medium border border-primary/20"
                            >
                                View Source <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
