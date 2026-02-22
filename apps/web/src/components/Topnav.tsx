"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import globalData from "@/config/global.json";
import ReportPop from "@/components/ReportPop"

export default function Navbar() {
    const [reportOpen, setReportOpen] = useState(false);

    return (
        <>
            <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-lg" />
                    <div>
                        <h1 className="font-semibold text-foreground">{globalData.header.title}</h1>
                        <p className="text-sm text-muted-foreground">{globalData.header.subtitle}</p>
                    </div>
                </div>

                <div className="relative w-full max-w-md mx-8">
                    <input
                        type="text"
                        placeholder="Search areas or incident"
                        className="w-full rounded-lg border border-input bg-background px-4 py-2 pl-10 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                </div>

                <button
                    onClick={() => setReportOpen(true)}
                    className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors cursor-pointer"
                >
                    Report Incident
                </button>
            </nav>

            <ReportPop open={reportOpen} onClose={() => setReportOpen(false)} />
        </>
    );
}