import { X, TrendingUp, TrendingDown, Clock, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export interface RegionInfo {
    name: string;
    trendScores: { year: number; month: number; score: number }[];
    totalReports: number;
    latestIncidents: {
        type: string;
        time: string;
        description: string;
        mediaKey: string | null;
        aiConfidence: number | null;
    }[];
}

interface MapRegionPopupProps {
    info: RegionInfo;
    onClose: () => void;
    onIncidentClick: (incident: RegionInfo["latestIncidents"][0]) => void;
}

export default function MapRegionPopup({ info, onClose, onIncidentClick }: MapRegionPopupProps) {
    const chartData = info.trendScores.map((s) => ({
        month: new Date(s.year, s.month - 1).toLocaleString("en", { month: "short" }),
        score: s.score,
    }));

    const trendUp = chartData.length >= 2 && chartData[chartData.length - 1].score >= chartData[chartData.length - 2].score;
    const trendColor = trendUp ? "#22c55e" : "#ef4444";

    return (
        <div className="absolute z-50 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl overflow-hidden animate-in fade-in duration-300 w-[90%] top-4 left-1/2 -translate-x-1/2 slide-in-from-top-4 sm:w-80 sm:top-4 sm:left-4 sm:translate-x-0 sm:slide-in-from-left-4">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">{info.name}</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="px-4 pt-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">{info.totalReports}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Reports</span>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-4">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
                        Safety Score Trend
                    </span>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                                <defs>
                                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={trendColor} stopOpacity={0.03} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: "#888", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    padding={{ left: 10, right: 10 }}
                                />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a2e",
                                        border: "1px solid #333",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                    labelStyle={{ color: "#aaa" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke={trendColor}
                                    strokeWidth={2}
                                    fill="url(#scoreFill)"
                                    dot={{ fill: trendColor, r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">No trend data available.</span>
                    )}
                </div>

                <div className="border-t border-border pt-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
                        Latest Incidents ({info.latestIncidents.length})
                    </span>
                    {info.latestIncidents.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {info.latestIncidents.map((incident, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded-lg p-2 -mx-2 transition-colors"
                                    onClick={() => onIncidentClick?.(incident)}
                                >
                                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2">
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
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatRelativeTime(incident.time)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{incident.description}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">No recent incidents reported.</span>
                    )}
                </div>
            </div>
        </div>
    );
}
