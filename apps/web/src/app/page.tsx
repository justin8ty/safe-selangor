import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";

export default function Home() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize="35%">
        <Sidebar />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="65%">
        <MapView />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}