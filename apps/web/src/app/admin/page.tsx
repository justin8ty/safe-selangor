"use client";

import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { QueueIncident } from "./types";
import VerificationQueue from "../../components/VerificationQueue";
import IncidentDetailsPanel from "../../components/IncidentDetailsPanel";

const mockQueue: QueueIncident[] = [
    {
        id: "RPT-8820",
        type: "Vandalism",
        time: "45 mins ago",
        title: "Vandalism Incident",
        description: "Graffiti sprayed on the community center wall. Again.",
        trustScore: 15,
        confidence: 35,
        location: "Community Hall A",
        coordinates: { lat: 3.1412, lng: 101.6865 }
    },
    {
        id: "RPT-8821",
        type: "Robbery",
        time: "12 mins ago",
        title: "Armed Robbery",
        description: "Armed robbery at the convenience store. Two suspects fled on a motorbike heading north. One carrying a weapon.",
        trustScore: 88,
        confidence: 85,
        location: "Sector 4 Convenience Store",
        coordinates: { lat: 3.1450, lng: 101.7000 }
    }
];

export default function AdminPage() {
    const [selectedIncident, setSelectedIncident] = useState<QueueIncident>(mockQueue[0]);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <ResizablePanelGroup orientation="horizontal">
                {/* Left Panel: Verification Queue */}
                <ResizablePanel defaultSize="30%" className="border-r border-border bg-card">
                    <VerificationQueue
                        incidents={mockQueue}
                        selectedIncident={selectedIncident}
                        onSelectIncident={setSelectedIncident}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Panel: Incident Details */}
                <ResizablePanel defaultSize="70%">
                    <IncidentDetailsPanel incident={selectedIncident} />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
