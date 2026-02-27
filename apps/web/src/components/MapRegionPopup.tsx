import { X, TrendingUp, TrendingDown, Clock, ChevronRight } from "lucide-react";

export interface RegionInfo {
    name: string;
    crimeTrend: {
        change: string;
        direction: "up" | "down";
        period: string;
    };
    latestIncidents: {
        type: string;
        time: string;
        description: string;
    }[];
}

interface MapRegionPopupProps {
    info: RegionInfo;
    onClose: () => void;
    onIncidentClick: (incident: RegionInfo["latestIncidents"][0]) => void;
}

export default function MapRegionPopup({ info, onClose, onIncidentClick }: MapRegionPopupProps) {
    return (
        <div className="absolute top-4 left-4 z-10 w-80 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">{info.name}</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
                        Crime Trend ({info.crimeTrend.period})
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 font-bold ${info.crimeTrend.direction === 'up' ? 'text-destructive' : 'text-green-500'}`}>
                            {info.crimeTrend.direction === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {info.crimeTrend.change}
                        </span>
                        <span className="text-sm text-muted-foreground">vs last period</span>
                    </div>
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
                                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
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
                                                {incident.time}
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
