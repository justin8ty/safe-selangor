"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getModerationReports, approveReport, rejectReport } from "@/lib/services";
import { ModerationQueueItem } from "@/types";
import { queryClient } from "@/lib/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import VerificationQueue from "../../components/VerificationQueue";
import IncidentDetailsPanel from "../../components/IncidentDetailsPanel";
import { useRealTime } from "@/hooks/useRealTime";

export default function AdminPage() {
    const [selectedIncident, setSelectedIncident] = useState<ModerationQueueItem | null>(null);

    useRealTime([["moderation-reports"]])

    const { data, isLoading } = useQuery({
        queryKey: ["moderation-reports"],
        queryFn: getModerationReports,
    });

    const items: ModerationQueueItem[] = data?.items ?? [];

    const { mutate: approve } = useMutation({
        mutationFn: (reportId: string) => approveReport(reportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
            setSelectedIncident(null);
        },
    });

    const { mutate: reject } = useMutation({
        mutationFn: (reportId: string) => rejectReport(reportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
            setSelectedIncident(null);
        },
    });

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <ResizablePanelGroup orientation="horizontal">

                <ResizablePanel defaultSize="35%" className="border-r border-border bg-card">
                    <VerificationQueue
                        incidents={items}
                        selectedIncident={selectedIncident}
                        onSelectIncident={setSelectedIncident}
                        isLoading={isLoading}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize="65%">
                    <IncidentDetailsPanel
                        incident={selectedIncident}
                        onApprove={(id) => approve(id)}
                        onReject={(id) => reject(id)}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
