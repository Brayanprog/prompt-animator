import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Download, CheckCircle, Loader2, AlertCircle } from "lucide-react";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const ai = await import("@/lib/ai");
      await ai.loadModel((pct, text) => {
        setProgress(pct);
        setProgressText(text);
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-1 text-sidebar-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-sidebar-accent">
          <Settings className="h-5 w-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your JavaMotion configuration</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold">AI Model (WebLLM)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Qwen2.5-Coder-1.5B runs locally in your browser. You need to download it once (~1GB) before generating scenes.
                </p>
              </div>
            </div>

            {done ? (
              <div className="flex items-center gap-2 p-2 bg-card rounded-md">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Model ready</span>
              </div>
            ) : downloading ? (
              <div className="space-y-2">
                <div className="w-full bg-card rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground truncate">{progressText || `${progress}%`}</p>
                </div>
              </div>
            ) : (
              <Button onClick={handleDownload} className="w-full gap-2" size="sm">
                <Download className="h-4 w-4" />
                Download AI Model
              </Button>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">{error}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-semibold">About JavaMotion</h4>
            <p className="text-xs text-muted-foreground">
              AI-powered motion graphics editor. Describe your animation in natural language and the AI generates it for you. All processing happens locally in your browser — no data leaves your device.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
