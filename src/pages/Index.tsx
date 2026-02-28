import { useState, useCallback } from "react";
import { DEFAULT_SCENE } from "@/lib/default-scene";
import { useSceneEditor } from "@/hooks/use-scene-editor";
import { exportVideo } from "@/lib/exporter";
import type { AppStatus } from "@/lib/scene-types";
import { SidebarNav } from "@/components/SidebarNav";
import { ChatPanel } from "@/components/ChatPanel";
import { VideoPreview } from "@/components/VideoPreview";
import { EditingPanel } from "@/components/EditingPanel";
import { TimelinePanel } from "@/components/TimelinePanel";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [modelProgressText, setModelProgressText] = useState("");
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedElement, setSelectedElement] = useState(0);
  const { toast } = useToast();

  const {
    scene,
    updateBackground,
    updateElement,
    updateElementAnimation,
    updateDuration,
    replaceScene,
  } = useSceneEditor(DEFAULT_SCENE);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the animation you want to create." });
      return;
    }
    try {
      const ai = await import("@/lib/ai");
      if (!ai.isModelLoaded()) {
        setStatus("loading-model");
        await ai.loadModel((pct, text) => {
          setModelProgress(pct);
          setModelProgressText(text);
        });
      }
      setStatus("generating");
      const newScene = await ai.generateScene(prompt);
      replaceScene(newScene);
      setSelectedElement(0);
      setStatus("idle");
      toast({ title: "Scene generated!", description: "Your animation is ready to preview." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setStatus("idle");
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [prompt, replaceScene, toast]);

  const handleExport = useCallback(async () => {
    setStatus("exporting");
    setExportProgress(0);
    try {
      await exportVideo(scene, (pct) => setExportProgress(pct));
      setStatus("idle");
      toast({ title: "Export complete!", description: "Your video has been downloaded." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setStatus("idle");
      toast({ title: "Export error", description: msg, variant: "destructive" });
    }
  }, [scene, toast]);

  const isExporting = status === "exporting";

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">Java</span>Motion
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-1.5 text-xs"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {isExporting ? `${exportProgress}%` : "Download"}
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "chat" && (
          <ChatPanel
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            status={status}
            modelProgress={modelProgress}
            modelProgressText={modelProgressText}
          />
        )}

        <VideoPreview scene={scene} />

        <EditingPanel
          scene={scene}
          selectedElement={selectedElement}
          onSelectElement={setSelectedElement}
          onUpdateBackground={updateBackground}
          onUpdateElement={updateElement}
          onUpdateElementAnimation={updateElementAnimation}
          onUpdateDuration={updateDuration}
        />
      </div>

      <TimelinePanel scene={scene} currentFrame={0} />
    </div>
  );
};

export default Index;
