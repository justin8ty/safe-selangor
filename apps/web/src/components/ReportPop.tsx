"use client";

import { useState, useEffect } from "react";
import { X, MapPin, CheckCircle, Swords, Landmark } from "lucide-react";
import { createReportDraft, createReport } from "@/lib/services";
import { postRequest } from "@/lib/interceptor";
import { toast } from "sonner";

const INCIDENT_TYPES = [
    { id: "violent", label: "Violent", icon: Swords },
    { id: "property", label: "Property", icon: Landmark },
];

interface ReportModalProps {
    open: boolean;
    onClose: () => void;
}

export default function ReportPop({ open, onClose }: ReportModalProps) {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [location, setLocation] = useState("");
    const [details, setDetails] = useState("");
    const [reportId, setReportId] = useState<string | null>(null);
    const [districts, setDistricts] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Reset form when opened
    useEffect(() => {
        if (open) {
            setSelectedType(null);
            setLocation("");
            setDetails("");
            setReportId(null);
            setFile(null);
            setSubmitting(false);
            setLoadingLocation(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        async function initDraft() {
            setLoadingLocation(true);
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 15000,
                    });
                });

                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                if (cancelled) return;

                const draft = await createReportDraft({ lat, lng });
                if (cancelled) return;

                setReportId(draft.reportId);

                // Preselect computed district if available.
                if (draft.district) {
                    setLocation(draft.district);
                }

                // Populate select options from local geojson so it matches the map.
                const res = await fetch("/map.geojson");
                const geo = (await res.json()) as {
                    features?: Array<{ properties?: { name?: unknown } }>;
                };

                const names = Array.from(
                    new Set(
                        (geo.features || [])
                            .map((f) => f?.properties?.name)
                            .filter(
                                (n): n is string =>
                                    typeof n === "string" && n.trim().length > 0
                            )
                            .map((n) => n.trim())
                    )
                ).sort((a, b) => a.localeCompare(b));
                if (!cancelled) setDistricts(names);
            } catch (err) {
                if (!cancelled) {
                    toast.error(
                        err instanceof Error
                            ? err.message
                            : "Failed to get your precise location. Please allow location access."
                    );
                }
            } finally {
                if (!cancelled) setLoadingLocation(false);
            }
        }

        initDraft();

        return () => {
            cancelled = true;
        };
    }, [open]);

    if (!open) return null;

    const canSubmit =
        !!reportId && !!location && !!selectedType && !!file && !submitting;

    async function uploadImageToSupabase(f: File): Promise<string> {
        const sign = await postRequest({
            url: "/uploads/sign",
            data: { files: [{ mime: f.type }] },
        });

        const upload = sign.uploads?.[0];
        if (!upload?.signedUrl || !upload?.path) {
            throw new Error("Failed to sign upload");
        }

        const putRes = await fetch(upload.signedUrl, {
            method: "PUT",
            headers: { "content-type": f.type },
            body: f,
        });

        if (!putRes.ok) {
            const text = await putRes.text().catch(() => "");
            throw new Error(`Upload failed (${putRes.status}): ${text}`);
        }

        return upload.path as string;
    }

    const handleSubmit = async () => {
        if (!reportId || !file || !selectedType) return;

        setSubmitting(true);
        try {
            const storageKey = await uploadImageToSupabase(file);

            await createReport({
                reportId,
                district: location,
                type: selectedType as "violent" | "property",
                storageKeys: [storageKey],
                details: details.trim().length ? details.trim() : undefined,
            });

            toast.success("Report submitted. Pending verification.");
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to submit report");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">REPORT INCIDENT</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Help the Community Stay Informed
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 1. Location */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">1. CONFIRM LOCATION</h3>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-4 py-3 pl-10 text-sm text-foreground appearance-none"
                        >
                            <option value="">
                                {loadingLocation ? "Getting your location..." : "Select region..."}
                            </option>
                            {districts.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Incident Type */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">2. SELECT INCIDENT TYPE</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {INCIDENT_TYPES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setSelectedType(id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${selectedType === id
                                    ? "bg-destructive text-destructive-foreground border-destructive"
                                    : "border-input bg-background text-foreground hover:border-muted-foreground"
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Details */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">3. ADD DETAILS</h3>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Describe what you see. Specific details help the community."
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                    />
                </div>

                {/* 4. Image */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">4. ADD IMAGE</h3>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        An image is required to submit a report.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex items-center gap-2 bg-destructive text-destructive-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {submitting ? "Submitting..." : "Submit Report"}
                    </button>
                </div>
            </div>
        </div>
    );
}
