"use client";

import { Clock, MapPin, Image as ImageIcon, CheckCircle, XCircle, MessageSquare, ShieldAlert, Star } from "lucide-react";
import { QueueIncident } from "../app/admin/types";
import MapView from "@/components/MapView";

interface IncidentDetailsPanelProps {
    incident: QueueIncident | null;
}

export default function IncidentDetailsPanel({ incident }: IncidentDetailsPanelProps) {
    if (!incident) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                Select an incident from the queue to view details
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border bg-card flex items-start justify-between">
                <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        QUEUE &gt; #{incident.id}
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{incident.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Confidence</p>
                        <p className="text-lg font-bold text-green-500">{incident.confidence}%</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-background">
                <div className="max-w-4xl mx-auto space-y-6">

                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                            <h3 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wide">
                                <MapPin size={16} className="text-cyan-500" /> Location Context
                            </h3>
                            <span className="text-sm text-muted-foreground">{incident.location}</span>
                        </div>
                        <div className="h-[250px] bg-muted relative">
                            {/* In a real app we'd pass coordinates to MapView, but using placeholder for now to match UI layout */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="bg-orange-600 border-2 border-orange-400 w-4 h-4 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.6)]" />
                                <div className="absolute mt-12 bg-orange-950/80 border border-orange-500 text-orange-200 text-xs px-2 py-1 rounded font-mono">
                                    REPORT {incident.id.replace('RPT-', '#')}
                                </div>
                            </div>
                            <div className="w-full h-full opacity-50 grayscale">
                                <MapView />
                            </div>
                        </div>
                    </div>

                    {/* Incident Details & AI Analysis */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wide">
                                <ShieldAlert size={16} className="text-primary" /> Incident Details
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-muted/30 border border-border rounded-lg p-4">
                                <p className="text-sm leading-relaxed">{incident.description}</p>
                            </div>

                            {/* Evidence */}
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide text-muted-foreground">Evidence (1)</h4>
                                <div className="flex gap-4">
                                    <div className="w-48 h-32 bg-muted border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors">
                                        <div className="flex flex-col items-center gap-2">
                                            <ImageIcon size={20} />
                                            <span className="text-xs font-medium">View Image 1</span>
                                        </div>
                                    </div>
                                    <div className="w-48 h-32 bg-muted border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors">
                                        <div className="flex flex-col items-center gap-2">
                                            <ImageIcon size={20} />
                                            <span className="text-xs font-medium">View Image 2</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-border rounded-lg p-4 bg-muted/10">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4 uppercase tracking-wide">
                            <Star size={16} className="text-yellow-500" /> AI Analysis
                        </h4>
                        <div className="flex items-center justify-between p-3 border border-border rounded-md bg-background">
                            <span className="text-sm text-muted-foreground font-medium">Confidence Score</span>
                            <span className="text-sm font-bold text-green-500">{incident.confidence}%</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="p-4 border-t border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={16} />
                    Received {incident.time}
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-semibold uppercase tracking-wide">
                        <XCircle size={16} /> Reject
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold uppercase tracking-wide shadow-lg shadow-primary/20">
                        <CheckCircle size={16} /> Verify & Publish
                    </button>
                </div>
            </div>
        </div>
    );
}
