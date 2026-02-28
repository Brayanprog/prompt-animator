import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Sparkles } from "lucide-react";
import type { AppStatus } from "@/lib/scene-types";

interface ChatPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  status: AppStatus;
  modelProgress: number;
  modelProgressText: string;
}

export function ChatPanel({
  prompt,
  onPromptChange,
  onGenerate,
  status,
  modelProgress,
  modelProgressText,
}: ChatPanelProps) {
  const isLoading = status === "loading-model" || status === "generating";

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Chat</h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-foreground">
            <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
            <strong>First time?</strong> Go to <span className="text-primary font-medium">Settings</span> (bottom of sidebar) to download the AI model before generating.
          </p>
        </div>

        {status === "loading-model" && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs font-medium">Downloading AI model...</span>
            </div>
            <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${modelProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{modelProgressText}</p>
          </div>
        )}

        {status === "generating" && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-xs font-medium">Generating your scene...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="relative">
          <Textarea
            placeholder="Describe what you want to create"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="resize-none bg-muted border-0 pr-10 min-h-[80px] text-sm"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onGenerate();
              }
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={onGenerate}
            disabled={isLoading}
            className="absolute bottom-2 right-2 h-7 w-7 text-muted-foreground hover:text-primary"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>JavaMotion AI</span>
          <span className="ml-auto">Token based</span>
        </div>
      </div>
    </div>
  );
}
