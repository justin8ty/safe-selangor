"use client";

import { Info } from "lucide-react";
import { useState, useMemo } from "react";
import IncidentDetailsPop, { Incident } from "./IncidentDetailsPop";
import IncidentCard from "./IncidentCard";
import { FeedItem } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
    feedItems: FeedItem[];
    allMonthScores: Record<string, { year: number; month: number; score: number }[]>;
}

export default function Sidebar({ feedItems, allMonthScores }: SidebarProps) {
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const incidents = feedItems;

    const overallScore = useMemo(() => {
        const allScores = Object.values(allMonthScores);
        if (allScores.length === 0) return null;
        const flat = allScores.flat();
        const latest = flat.reduce((best, s) =>
            s.year > best.year || (s.year === best.year && s.month > best.month) ? s : best
            , flat[0]);
        const latestScores = flat.filter(s => s.year === latest.year && s.month === latest.month);
        const avg = latestScores.reduce((sum, s) => sum + s.score, 0) / latestScores.length;
        return Math.round(avg * 100) / 100;
    }, [allMonthScores]);


    return (
        <div className="flex flex-col p-4 md:p-6 gap-4 md:gap-6 h-full w-full md:min-w-[300px]">

            <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Current Month Safety Score
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="text-muted-foreground cursor-help" size={14} />
                            </TooltipTrigger>
                            <TooltipContent
                                side="right"
                                align="start"
                                className="w-52 p-3 font-normal tracking-normal shadow-xl border-border bg-white text-black"
                                sideOffset={12}
                            >
                                <p className="text-gray-600 mb-2">Average safety score across all districts for the latest month.</p>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="shrink-0 w-3 h-3 rounded-sm" style={{ background: "#1cfa2f" }} />
                                        <span className="text-black">85-100: Safe</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="shrink-0 w-3 h-3 rounded-sm" style={{ background: "#ddfe20" }} />
                                        <span className="text-black">70-84: Moderate</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="shrink-0 w-3 h-3 rounded-sm" style={{ background: "#fa7b19" }} />
                                        <span className="text-black">40-69: Caution</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="shrink-0 w-3 h-3 rounded-sm" style={{ background: "#ff2a2a" }} />
                                        <span className="text-black">0-39: Dangerous</span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <p className={`text-3xl font-bold mt-2 ${overallScore === null ? "text-muted-foreground"
                    : overallScore >= 85 ? "text-green-500"
                        : overallScore >= 70 ? "text-yellow-400"
                            : overallScore >= 40 ? "text-orange-500"
                                : "text-red-500"
                    }`}>
                    {overallScore !== null ? overallScore.toFixed(2) : "-"}
                </p>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Incident Feed
                </div>
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                    {incidents.map((incident) => (
                        <IncidentCard
                            key={incident.reportId}
                            type={incident.type}
                            description={incident.description}
                            district={incident.district}
                            state={incident.state}
                            landmarkLabel={incident.landmarkLabel ?? null}
                            aiConfidence={incident.aiConfidence ?? null}
                            time={incident.createdAt}
                            onClick={() => setSelectedIncident({
                                type: incident.type || "unknown",
                                location: `${incident.district ?? "Unknown"}${incident.state ? `, ${incident.state}` : ""}`,
                                description: incident.description || "No description provided.",
                                time: incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "",
                                mediaKey: incident.mediaKey,
                                mediaKeys: incident.mediaKeys ?? (incident.mediaKey ? [incident.mediaKey] : []),
                                landmarkLabel: incident.landmarkLabel ?? null,
                                aiConfidence: incident.aiConfidence ?? null,
                            })}

                        />
                    ))}
                </div>
            </div>

            <IncidentDetailsPop
                open={!!selectedIncident}
                onClose={() => setSelectedIncident(null)}
                incident={selectedIncident}
            />
        </div>
    );
}
