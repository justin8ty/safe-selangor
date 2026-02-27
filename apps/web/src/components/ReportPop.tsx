"use client";

import { useState, useEffect } from "react";
import { X, MapPin, CheckCircle, Swords, Landmark, Loader2 } from "lucide-react";
import { createReportDraft, createReport, getReport } from "@/lib/services";
import { postRequest } from "@/lib/interceptor";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type UploadStatus = "pending" | "signing" | "uploading" | "uploaded" | "error";

type ReportImage = {
    id: string;
    file: File;
    previewUrl: string;
    status: UploadStatus;
    error?: string;
    storageKey?: string;
};

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
    const [images, setImages] = useState<ReportImage[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Reset form when opened
    useEffect(() => {
        if (open) {
            setSelectedType(null);
            setLocation("");
            setDetails("");
            setReportId(null);
            // Revoke previews on reset.
            setImages((prev) => {
                for (const img of prev) URL.revokeObjectURL(img.previewUrl);
                return [];
            });
            setSubmitting(false);
            setLoadingLocation(false);
            setUploading(false);
        }
    }, [open]);

    useEffect(() => {
        // Cleanup previews on unmount.
        return () => {
            setImages((prev) => {
                for (const img of prev) URL.revokeObjectURL(img.previewUrl);
                return prev;
            });
        };
    }, []);

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
        !!reportId &&
        !!location &&
        !!selectedType &&
        images.some((i) => i.status === "uploaded") &&
        !submitting &&
        !uploading;

    async function signAndUploadPending(nextImages: ReportImage[]) {
        const pending = nextImages.filter((img) => img.status === "pending");
        if (pending.length === 0) return;
        if (pending.length + nextImages.filter((i) => i.status !== "pending").length > 3) {
            // Should be prevented by UI, but keep a hard guard.
            throw new Error("You can upload up to 3 images per report");
        }

        setUploading(true);
        setImages((prev) =>
            prev.map((img) =>
                img.status === "pending" ? { ...img, status: "signing", error: undefined } : img,
            ),
        );

        try {
            const sign = await postRequest({
                url: "/uploads/sign",
                data: { files: pending.map((p) => ({ mime: p.file.type })) },
            });

            const bucket = sign?.bucket as string | undefined;
            const uploads = sign?.uploads as Array<{ path?: string; token?: string }> | undefined;
            if (!bucket || !uploads || uploads.length !== pending.length) {
                throw new Error("Failed to sign uploads");
            }

            for (let idx = 0; idx < pending.length; idx++) {
                const img = pending[idx];
                const signed = uploads[idx];
                if (!signed?.path || !signed?.token) {
                    setImages((prev) =>
                        prev.map((p) =>
                            p.id === img.id
                                ? { ...p, status: "error", error: "Failed to sign upload" }
                                : p,
                        ),
                    );
                    continue;
                }

                setImages((prev) =>
                    prev.map((p) => (p.id === img.id ? { ...p, status: "uploading" } : p)),
                );

                const { error } = await supabase.storage
                    .from(bucket)
                    .uploadToSignedUrl(signed.path, signed.token, img.file, {
                        contentType: img.file.type,
                    });

                if (error) {
                    setImages((prev) =>
                        prev.map((p) =>
                            p.id === img.id
                                ? { ...p, status: "error", error: error.message }
                                : p,
                        ),
                    );
                    continue;
                }

                setImages((prev) =>
                    prev.map((p) =>
                        p.id === img.id
                            ? { ...p, status: "uploaded", storageKey: signed.path }
                            : p,
                    ),
                );
            }
        } finally {
            setUploading(false);
        }
    }

    const handleSubmit = async () => {
        if (!reportId || !selectedType) return;

        setSubmitting(true);
        try {
            const storageKeys = images
                .filter((i) => i.status === "uploaded" && i.storageKey)
                .map((i) => i.storageKey as string);

            if (storageKeys.length === 0) {
                throw new Error("Please upload at least one image");
            }

            await createReport({
                reportId,
                district: location,
                type: selectedType as "violent" | "property",
                storageKeys,
                details: details.trim().length ? details.trim() : undefined,
            });

            // Best-effort: show AI moderation updates quickly if they land.
            for (let i = 0; i < 6; i++) {
                await new Promise((r) => setTimeout(r, 1000));
                const res = await getReport(reportId).catch(() => null);
                const ai = res?.report?.ai_confidence;
                if (typeof ai === "number" && ai > 0) break;
            }

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
                        id="report-images"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                            const selected = Array.from(e.target.files ?? []);
                            // allow picking same file again by resetting input value
                            e.currentTarget.value = "";

                            if (selected.length === 0) return;

                            const available = 3 - images.length;
                            if (available <= 0) {
                                toast.error("You can upload up to 3 images per report");
                                return;
                            }

                            const slice = selected.slice(0, available);
                            if (selected.length > slice.length) {
                                toast.error("Only 3 images allowed per report");
                            }

                            const next: ReportImage[] = slice.map((file) => ({
                                id: crypto.randomUUID(),
                                file,
                                previewUrl: URL.createObjectURL(file),
                                status: "pending",
                            }));

                            const nextImages = [...images, ...next];
                            setImages(nextImages);
                            try {
                                await signAndUploadPending(nextImages);
                            } catch (err) {
                                toast.error(
                                    err instanceof Error
                                        ? err.message
                                        : "Failed to upload images",
                                );
                            }
                        }}
                        className="sr-only"
                    />
                    <label
                        htmlFor="report-images"
                        className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors cursor-pointer select-none"
                    >
                        Choose Files
                    </label>
                    <span className="ml-3 text-xs text-muted-foreground">
                        {images.length}/3 selected
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">
                        Upload up to 3 images. At least one image is required.
                    </p>

                    {images.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {images.map((img) => (
                                <div key={img.id} className="relative rounded-lg border border-border bg-background p-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            URL.revokeObjectURL(img.previewUrl);
                                            setImages((prev) => prev.filter((p) => p.id !== img.id));
                                        }}
                                        className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground"
                                        aria-label="Remove image"
                                    >
                                        <X className="w-3.5 h-3.5 mx-auto" />
                                    </button>

                                    <img
                                        src={img.previewUrl}
                                        alt={img.file.name}
                                        className="w-full h-20 object-cover rounded-md"
                                    />
                                    <div className="mt-1 text-[10px] text-muted-foreground truncate" title={img.file.name}>
                                        {img.file.name}
                                    </div>
                                    <div className="text-[10px] mt-0.5">
                                        {img.status === "signing" && (
                                            <span className="text-muted-foreground">Signing...</span>
                                        )}
                                        {img.status === "uploading" && (
                                            <span className="text-muted-foreground">Uploading...</span>
                                        )}
                                        {img.status === "uploaded" && (
                                            <span className="text-green-600">Uploaded</span>
                                        )}
                                        {img.status === "error" && (
                                            <span className="text-red-600" title={img.error}>
                                                Upload failed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex items-center gap-2 bg-destructive text-destructive-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting || uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        {submitting
                            ? "Submitting..."
                            : uploading
                                ? "Uploading..."
                                : "Submit Report"}
                    </button>
                </div>
            </div>
        </div>
    );
}
