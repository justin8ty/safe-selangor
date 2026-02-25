"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "@/lib/services";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { mutate: login, isPending } = useMutation({
        mutationFn: () => loginUser({ email, password }),
        onSuccess: async (data) => {
            await supabase.auth.setSession({
                access_token: data.accessToken,
                refresh_token: data.refreshToken,
            });
            router.push("/");
        },
        onError: (error: any) => console.log("Login failed:", error.message),
    });

    return (
        <div className="relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

            <div className="z-10 w-full max-w-md px-4">
                <Card className="border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            Welcome
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter your details to sign in
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        login();
                    }}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="mt-4 flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link
                                    href="/signup"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
