"use client";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/services";
import { FeedItem } from "@/types";
import { useRealTime } from "@/hooks/useRealTime";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const DISTRICTS = [
  "Brickfields", "Cheras", "Dang Wangi", "Sentul",
  "W.P. Putrajaya", "Wangsa Maju", "Ampang Jaya", "Gombak",
  "Kajang", "Klang Selatan", "Klang Utara", "Petaling Jaya",
  "Sepang", "Serdang", "Shah Alam", "Subang Jaya"
];

export default function Home() {
  useRealTime([["feed"]])

  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["feed"],
    queryFn: getFeed,
    enabled: !!user,
  });

  const incidents: FeedItem[] = data?.items ?? [];

  const { data: scoresData } = useQuery({
    queryKey: ["safetyScores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("current_live_statistics")
        .select("district, score, year, month");
      if (!data) return {};
      const grouped: Record<string, { year: number; month: number; score: number }[]> = {};
      data.forEach((r) => {
        if (!grouped[r.district]) grouped[r.district] = [];
        grouped[r.district].push({ year: r.year, month: r.month, score: r.score });
      });
      Object.values(grouped).forEach((arr) =>
        arr.sort((a, b) => a.year - b.year || a.month - b.month)
      );
      return grouped;
    },
    enabled: !!user,
  });
  const allMonthScores = scoresData ?? {};

  const { data: districtCounts } = useQuery({
    queryKey: ["districtReportCounts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      const promises = DISTRICTS.map(async (d) => {
        const { count } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("district", d)
          .eq("status", "approved");
        counts[d] = count || 0;
      });
      await Promise.all(promises);
      return counts;
    },
    enabled: !!user,
  });

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize="30%">
        <Sidebar feedItems={incidents} allMonthScores={allMonthScores} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="70%">
        <MapView feedItems={incidents} allMonthScores={allMonthScores} districtCounts={districtCounts || {}} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}