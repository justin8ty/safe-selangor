"use client";

import { QueueIncident } from "../app/admin/types";

interface VerificationQueueProps {
    incidents: QueueIncident[];
    selectedIncident: QueueIncident | null;
    onSelectIncident: (incident: QueueIncident) => void;
}

export default function VerificationQueue({ incidents, selectedIncident, onSelectIncident }: VerificationQueueProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
                <h2 className="text-lg font-bold uppercase">Verification Queue</h2>
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    {incidents.length} PENDING VERIFICATIONS
                </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {incidents.map((incident) => (
                    <div
                        key={incident.id}
                        onClick={() => onSelectIncident(incident)}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedIncident?.id === incident.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-muted/50"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded bg-secondary text-secondary-foreground border border-border`}>
                                {incident.type}
                            </span>
                            <span className="text-xs text-muted-foreground">{incident.time}</span>
                        </div>
                        <p className="text-sm font-medium mb-1 line-clamp-2">{incident.description}</p>
                        <div className="flex items-center justify-between mt-3 text-xs">
                            <span className={`font-semibold flex items-center gap-1 ${incident.trustScore > 50 ? "text-green-500" : "text-orange-500"}`}>
                                <div className={`w-2 h-2 rounded-full ${incident.trustScore > 50 ? "bg-green-500" : "bg-orange-500"}`} />
                                {incident.trustScore}% Trust
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
