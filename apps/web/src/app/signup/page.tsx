"use client";

import Link from "next/link";
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
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/lib/services";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";



export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const { mutate: register, isPending } = useMutation({
        mutationFn: () => {
            if (password.length < 6) {
                throw new Error("Password must be at least 6 characters");
            }
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }

            return registerUser({ email, password });
        },
        onSuccess: (data) => {
            supabase.auth.setSession({
                access_token: data.accessToken,
                refresh_token: data.refreshToken,
            });
            window.location.href = "/login";
        },
        onError: (error: unknown) => {
            if (error instanceof Error && error.message === "Passwords do not match") {
                toast.error(error.message);
            }
        },
    });

    return (
        <div className="relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

            <div className="z-10 w-full max-w-md px-4">
                <Card className="border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            Create an account
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter your details below to create your account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={(e) => { e.preventDefault(); register(); }}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-background/50 transition-colors focus:bg-background"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="mt-4 flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
