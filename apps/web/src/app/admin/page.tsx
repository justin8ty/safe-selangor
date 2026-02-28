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
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
    const [selectedIncident, setSelectedIncident] = useState<ModerationQueueItem | null>(null);

    const { user } = useAuth();

    useRealTime([["moderation-reports"]], !!user);

    const { data, isLoading } = useQuery({
        queryKey: ["moderation-reports"],
        queryFn: getModerationReports,
        enabled: !!user,
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
        <div className="flex h-screen bg-background text-foreground overflow-hidden w-full">
            {/* MOBILE LAYOUT*/}
            <div className="md:hidden flex flex-col flex-1 w-full h-full">
                {!selectedIncident ? (
                    <div className="flex-1 w-full bg-card overflow-y-auto">
                        <VerificationQueue
                            incidents={items}
                            selectedIncident={selectedIncident}
                            onSelectIncident={setSelectedIncident}
                            isLoading={isLoading}
                        />
                    </div>
                ) : (
                    <div className="flex-1 w-full overflow-hidden flex flex-col">
                        <IncidentDetailsPanel
                            incident={selectedIncident}
                            onApprove={(id) => approve(id)}
                            onReject={(id) => reject(id)}
                            onBack={() => setSelectedIncident(null)}
                        />
                    </div>
                )}
            </div>

            {/* DESKTOP LAYOUT*/}
            <div className="hidden md:flex flex-1 w-full h-full">
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
        </div>
    );
}
