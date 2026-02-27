import { supabase } from "./supabase.ts";

export type FeedItem = {
  reportId: string;
  state: string | null;
  district: string | null;
  landmarkLabel?: string | null;
  type: string | null;
  description: string | null;
  date: string | null;
  createdAt: string | null;
  mediaKeys: string[];
  mediaKey: string | null;
  likes: number | null;
  views: number | null;
};

export async function getReportCard(
  reportId: string,
): Promise<FeedItem | null> {
  const { data: report, error: reportErr } = await supabase
    .from("reports")
    .select(
      "id,state,district,landmark_label,type,description,date,created_at,status",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (reportErr) throw reportErr;
  if (!report) return null;
  if (report.status !== "approved") return null;

  const [
    { data: mediaRows, error: mediaErr },
    { data: metrics, error: metricsErr },
  ] = await Promise.all([
    supabase
      .from("report_media")
      .select("storage_key")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_metrics")
      .select("likes,views")
      .eq("report_id", reportId)
      .maybeSingle(),
  ]);

  if (mediaErr) throw mediaErr;
  if (metricsErr) throw metricsErr;

  const mediaKeys = (mediaRows ?? [])
    .map((m) => m.storage_key as string)
    .filter((k) => typeof k === "string" && k.length > 0);

  return {
    reportId: report.id as string,
    state: (report.state ?? null) as string | null,
    district: (report.district ?? null) as string | null,
    landmarkLabel: (report.landmark_label ?? null) as string | null,
    type: (report.type ?? null) as string | null,
    description: (report.description ?? null) as string | null,
    date: (report.date ?? null) as string | null,
    createdAt: (report.created_at ?? null) as string | null,
    mediaKeys,
    mediaKey: mediaKeys[0] ?? null,
    likes: (metrics?.likes ?? null) as number | null,
    views: (metrics?.views ?? null) as number | null,
  };
}

export async function getApprovedFeed(limit = 50): Promise<FeedItem[]> {
  const { data: reports, error: reportsErr } = await supabase
    .from("reports")
    .select("id,state,district,landmark_label,type,description,date,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (reportsErr) throw reportsErr;

  const reportIds = (reports ?? []).map((r) => r.id as string);
  if (reportIds.length === 0) return [];

  const [
    { data: media, error: mediaErr },
    { data: metrics, error: metricsErr },
  ] = await Promise.all([
    supabase
      .from("report_media")
      .select("report_id,storage_key")
      .in("report_id", reportIds),
    supabase
      .from("report_metrics")
      .select("report_id,likes,views")
      .in("report_id", reportIds),
  ]);

  if (mediaErr) throw mediaErr;
  if (metricsErr) throw metricsErr;

  const mediaKeysByReportId = new Map<string, string[]>();
  for (const m of media ?? []) {
    const rid = m.report_id as string;
    const key = m.storage_key as string;
    const arr = mediaKeysByReportId.get(rid) ?? [];
    arr.push(key);
    mediaKeysByReportId.set(rid, arr);
  }

  const metricsByReportId = new Map<string, { likes: number; views: number }>();
  for (const mm of metrics ?? []) {
    metricsByReportId.set(mm.report_id as string, {
      likes: (mm.likes ?? 0) as number,
      views: (mm.views ?? 0) as number,
    });
  }

  return (reports ?? []).map((r) => {
    const rid = r.id as string;
    const met = metricsByReportId.get(rid);
    const mediaKeys = mediaKeysByReportId.get(rid) ?? [];
    return {
      reportId: rid,
      state: (r.state ?? null) as string | null,
      district: (r.district ?? null) as string | null,
      landmarkLabel: (r.landmark_label ?? null) as string | null,
      type: (r.type ?? null) as string | null,
      description: (r.description ?? null) as string | null,
      date: (r.date ?? null) as string | null,
      createdAt: (r.created_at ?? null) as string | null,
      mediaKeys,
      mediaKey: mediaKeys[0] ?? null,
      likes: met?.likes ?? null,
      views: met?.views ?? null,
    };
  });
}
