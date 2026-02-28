"use client";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/services";
import { FeedItem } from "@/types";
import { useRealTime } from "@/hooks/useRealTime";

export default function Home() {
  useRealTime([["feed"]])

  const { data } = useQuery({
    queryKey: ["feed"],
    queryFn: getFeed,
  });

  const incidents: FeedItem[] = data?.items ?? [];

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize="30%">
        <Sidebar feedItems={incidents} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="70%">
        <MapView feedItems={incidents} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}