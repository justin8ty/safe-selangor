"use client";

import { ModerationQueueItem } from "@/types";
import IncidentCard from "./IncidentCard";

interface VerificationQueueProps {
    incidents: ModerationQueueItem[];
    selectedIncident: ModerationQueueItem | null;
    onSelectIncident: (incident: ModerationQueueItem) => void;
}

export default function VerificationQueue({ incidents, selectedIncident, onSelectIncident }: VerificationQueueProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
                <h2 className="text-lg font-bold uppercase">Verification Queue ({incidents.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {incidents.map((incident) => (
                    <IncidentCard
                        key={incident.reportId}
                        type={incident.report?.type ?? null}
                        description={incident.report?.description ?? null}
                        district={incident.report?.district ?? null}
                        state={incident.report?.state ?? null}
                        landmarkLabel={incident.report?.landmark_label ?? null}
                        aiConfidence={incident.report?.ai_confidence ?? null}
                        time={incident.report?.created_at ?? incident.queue?.createdAt ?? new Date().toISOString()}
                        isSelected={selectedIncident?.reportId === incident.reportId}
                        onClick={() => onSelectIncident(incident)}
                    />
                ))}

            </div>
        </div>
    );
}
