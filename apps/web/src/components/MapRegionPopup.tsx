import { X, TrendingUp, TrendingDown, Clock } from "lucide-react";

export interface RegionInfo {
    name: string;
    crimeTrend: {
        change: string;
        direction: "up" | "down";
        period: string;
    };
    latestIncident: {
        title: string;
        time: string;
        description: string;
    } | null;
}

interface MapRegionPopupProps {
    info: RegionInfo;
    onClose: () => void;
}

export default function MapRegionPopup({ info, onClose }: MapRegionPopupProps) {
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
                        Latest Incident
                    </span>
                    {info.latestIncident ? (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">
                                    {info.latestIncident.title}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock size={12} />
                                    {info.latestIncident.time}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {info.latestIncident.description}
                            </p>
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground italic">No recent incidents reported.</span>
                    )}
                </div>
            </div>
        </div>
    );
}
