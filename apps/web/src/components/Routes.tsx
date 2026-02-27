"use client";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function Routes({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
        const isAdminRoute = pathname.startsWith("/admin");

        // Not logged in = redirect to login (unless already on login/signup)
        if (!user && !isPublicRoute) {
            router.replace("/login");
            return;
        }

        // Logged in
        if (user && isPublicRoute) {
            router.replace("/");
            return;
        }

        // Non-admin trying to access admin
        if (user && isAdminRoute && user.role !== "moderator") {
            router.replace("/");
            return;
        }
    }, [user, isLoading, pathname]);

    if (isLoading) return null;

    return <>{children}</>;
}
