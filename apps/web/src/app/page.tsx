"use client";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/services";
import { FeedItem } from "@/types";

export default function Home() {
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
      <ResizablePanel defaultSize="35%">
        <Sidebar feedItems={incidents} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="65%">
        <MapView feedItems={incidents} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}