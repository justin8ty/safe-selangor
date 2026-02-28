"use client";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function Routes({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Reset the redirecting lock whenever the route successfully changes
    useEffect(() => {
        setIsRedirecting(false);
    }, [pathname]);

    useEffect(() => {
        if (isLoading) return;

        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
        const isAdminRoute = pathname.startsWith("/admin");

        // Not logged in = redirect to login (unless already on login/signup)
        if (!user && !isPublicRoute) {
            setIsRedirecting(true);
            router.replace("/login");
            return;
        }

        // Logged in
        if (user && isPublicRoute) {
            setIsRedirecting(true);
            router.replace("/");
            return;
        }

        // Non-admin trying to access admin
        if (user && isAdminRoute && user.role !== "moderator") {
            setIsRedirecting(true);
            router.replace("/");
            return;
        }
    }, [user, isLoading, pathname, router]);

    return (
        <>
            {(isLoading || isRedirecting) && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            )}
            <div style={{ display: (isLoading || isRedirecting) ? 'none' : 'contents' }}>
                {children}
            </div>
        </>
    );
}
