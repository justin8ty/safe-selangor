"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import globalData from "@/config/global.json";
import ReportPop from "@/components/ReportPop";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";

export default function Topnav() {
    const [reportOpen, setReportOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();

    const isAuthPage = pathname === "/login" || pathname === "/signup";

    return (
        <>
            <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-lg" />
                    <div>
                        <h1 className="font-semibold text-foreground">{globalData.header.title}</h1>
                        <p className="text-sm text-muted-foreground">{globalData.header.subtitle}</p>
                    </div>
                </Link>

                {!isAuthPage && (
                    <>
                        <div className="flex items-center gap-4">
                            {user?.role === "moderator" && (
                                <Link
                                    href={pathname.startsWith("/admin") ? "/" : "/admin"}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
                                >
                                    <Shield size={16} />
                                    {pathname.startsWith("/admin") ? "Main Page" : "Admin Page"}
                                </Link>
                            )}
                            <button
                                onClick={() => setReportOpen(true)}
                                className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors cursor-pointer"
                            >
                                Report Incident
                            </button>
                        </div>
                    </>
                )}
            </nav>

            {!isAuthPage && <ReportPop open={reportOpen} onClose={() => setReportOpen(false)} />}
        </>
    );
}
