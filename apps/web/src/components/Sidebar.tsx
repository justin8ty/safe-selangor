import { Info, Clock, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";

const crimeIndex = 52000;

const incidents = [
    {
        type: "Robbery",
        location: "Kuala Lumpur",
        description: "Armed robbery at Maybank",
        time: "30 min ago",
        source: "The Star News",
        sourceUrl: "#",
        color: "bg-red-500"
    },
    {
        type: "Public Disorder",
        location: "Cyberjayar",
        description: "Suspicious Activity in MRT Cyberjaya Utara Station",
        time: "1 day ago",
        source: "The Star News",
        sourceUrl: "#",
        color: "bg-amber-500"
    }
]

const crimeTrend = {
    period: "Last 30 hours",
    change: "20%",
    trend: "up"
}

export default function Sidebar() {
    return (
        <div className="flex flex-col p-6 gap-6 h-full min-w-[300px]">

            <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Current Crime Index
                    <Info className="text-muted-foreground cursor-help" size={14} />
                </div>
                <p className="text-3xl font-bold text-primary mt-2">
                    {crimeIndex.toLocaleString()}
                </p>
            </div>

            <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">Recent Incidents</h2>
                    <select className="text-xs border border-border rounded-md px-2 py-1 bg-background text-muted-foreground">
                        <option>Last 24 Hours</option>
                        <option>Last 7 Days</option>
                    </select>
                </div>

                {incidents.map((incident, i) => (
                    <div key={i} className="rounded-lg border border-border p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${incident.color}`} />
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {incident.type}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} />
                                {incident.time}
                            </span>
                        </div>
                        <p className="text-sm text-foreground">{incident.description}</p>
                        <Link
                            href={incident.sourceUrl}
                            className="text-xs text-primary self-end hover:underline flex items-center gap-1"
                        >
                            {incident.source} <ExternalLink size={12} />
                        </Link>
                    </div>
                ))}
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Crime Trend {crimeTrend.period}
                </span>
                <span className="text-sm font-semibold text-destructive flex items-center gap-1">
                    <TrendingUp size={12} /> {crimeTrend.change}
                </span>
            </div>
        </div>
    );
}