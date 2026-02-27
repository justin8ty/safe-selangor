"use client";

import { Clock, MapPin, Image as ImageIcon, CheckCircle, XCircle, MessageSquare, ShieldAlert, Star } from "lucide-react";
import MapView from "@/components/MapView";
import { ModerationQueueItem } from "@/types";
import { supabase } from "@/lib/supabase";

interface IncidentDetailsPanelProps {
    incident: ModerationQueueItem | null;
    onApprove: (reportId: string) => void;
    onReject: (reportId: string) => void;
}

function getMediaUrl(storageKey: string): string {
    const { data } = supabase.storage
        .from("reports")
        .getPublicUrl(storageKey);
    return data.publicUrl;
}


export default function IncidentDetailsPanel({ incident, onApprove, onReject }: IncidentDetailsPanelProps) {
    if (!incident) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                Select an incident from the queue to view details
            </div>
        );
    }

    const aiConfidence = Math.max(
        0,
        Math.min(100, incident.report?.ai_confidence ?? 0),
    );

    return (
        <div className="flex flex-col h-full">
            {/* HEADER */}
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Queue &gt; #{incident.reportId.slice(0, 8)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded flex items-center gap-1.5 uppercase ${incident.report?.type === "violent"
                        ? "bg-red-500/15 text-red-500"
                        : "bg-amber-500/15 text-amber-500"
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${incident.report?.type === "violent" ? "bg-red-500" : "bg-amber-500"
                            }`} />
                        {incident.report?.type ?? "Unknown"}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {new Date(incident.report?.created_at ?? incident.queue?.createdAt ?? Date.now()).toLocaleString()}
                </span>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* DESCRIPTION */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                                <ShieldAlert size={14} /> Description
                            </h4>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(incident.report?.created_at ?? incident.queue?.createdAt ?? Date.now()).toLocaleString()}
                            </span>
                        </div>
                        <div className="bg-muted/30 border border-border rounded-lg p-4">
                            <p className="text-sm leading-relaxed">{incident.report?.description || "No description provided."}</p>
                        </div>
                    </div>


                    {/* MAP + EVIDENCE side by side */}
                    <div className="grid grid-cols-2 gap-5">
                        {/* Map card */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="h-[250px]">
                                <MapView
                                    highlightDistrict={incident.report?.district ?? undefined}
                                    disableInteraction
                                />
                            </div>
                            <div className="p-3 bg-card border-t border-border flex items-center gap-2 text-sm">
                                <MapPin size={14} className="text-muted-foreground" />
                                <span>{incident.report?.district ?? "Unknown"}{incident.report?.state ? `, ${incident.report.state}` : ""}</span>
                            </div>
                        </div>

                        {/* Evidence card */}
                        <div className="rounded-xl overflow-hidden bg-card">
                            <div className="p-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                                    <ImageIcon size={14} /> Evidence ({incident.media.length})
                                </h4>
                            </div>
                            <div className="p-3">
                                {incident.media.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No evidence attached</p>
                                ) : (
                                    <div className="flex gap-3 flex-wrap">
                                        {incident.media.map((key, i) => (
                                            <img
                                                key={key}
                                                src={getMediaUrl(key)}
                                                alt={`Evidence ${i + 1}`}
                                                className="w-full max-w-[180px] h-30 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(getMediaUrl(key), "_blank")}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI ANALYSIS */}
                    <div className="rounded-xl border border-border p-4 bg-card">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                            <Star size={14} className="text-yellow-500" /> AI Analysis
                        </h4>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${aiConfidence >= 70
                                        ? "bg-green-500"
                                        : aiConfidence >= 40
                                            ? "bg-amber-500"
                                            : "bg-red-500"
                                        }`}
                                    style={{ width: `${aiConfidence}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold w-12 text-right">
                                {aiConfidence}
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-border bg-card flex items-center justify-end">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onReject(incident.reportId)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-semibold uppercase tracking-wide"
                    >
                        <XCircle size={16} /> Reject
                    </button>
                    <button
                        onClick={() => onApprove(incident.reportId)}
                        className="flex items-center gap-2 px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-semibold uppercase tracking-wide shadow-lg shadow-green-600/20"
                    >
                        <CheckCircle size={16} /> Verify & Publish
                    </button>
                </div>
            </div>
        </div>
    );

}
