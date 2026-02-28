import type { Scene, AnimationType } from "@/lib/scene-types";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type, Palette, Move, Clock, Sparkles } from "lucide-react";

interface EditingPanelProps {
  scene: Scene;
  selectedElement: number;
  onSelectElement: (i: number) => void;
  onUpdateBackground: (color: string) => void;
  onUpdateElement: (index: number, updates: Record<string, unknown>) => void;
  onUpdateElementAnimation: (index: number, updates: Record<string, unknown>) => void;
  onUpdateDuration: (duration: number) => void;
}

const ANIMATION_PRESETS: { value: AnimationType; label: string; emoji: string; desc: string }[] = [
  { value: "typing", label: "Typing", emoji: "⌨️", desc: "Characters appear one by one" },
  { value: "fadeIn", label: "Fade In", emoji: "✨", desc: "Gradually becomes visible" },
  { value: "scaleIn", label: "Scale In", emoji: "🔍", desc: "Grows from small to full size" },
  { value: "none", label: "Static", emoji: "📌", desc: "No animation, always visible" },
];

export function EditingPanel({
  scene,
  selectedElement,
  onSelectElement,
  onUpdateBackground,
  onUpdateElement,
  onUpdateElementAnimation,
  onUpdateDuration,
}: EditingPanelProps) {
  const el = scene.elements[selectedElement];
  if (!el) return null;

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h2 className="font-semibold text-sm">Properties</h2>
      </div>

      {/* Scene section */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Palette className="h-3.5 w-3.5" />
          Scene
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={scene.background}
            onChange={(e) => onUpdateBackground(e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer border border-border"
          />
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">Background</Label>
            <p className="text-xs font-mono">{scene.background}</p>
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Duration: {(scene.duration / scene.fps).toFixed(1)}s ({scene.duration} frames)</Label>
          <Slider
            value={[scene.duration]}
            onValueChange={([v]) => onUpdateDuration(v)}
            min={30}
            max={600}
            step={1}
            className="mt-1"
          />
        </div>
      </div>

      {/* Element tabs */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          <Type className="h-3.5 w-3.5" />
          Elements
        </div>
        <div className="flex gap-1">
          {scene.elements.map((_, i) => (
            <button
              key={i}
              onClick={() => onSelectElement(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedElement === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Text {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Element */}
      <div className="p-3 space-y-4 flex-1">
        {/* Text */}
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Type className="h-3 w-3" /> Text Content
          </Label>
          <Input
            value={el.text}
            onChange={(e) => onUpdateElement(selectedElement, { text: e.target.value })}
            className="mt-1 text-sm h-9"
          />
        </div>

        {/* Color */}
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Palette className="h-3 w-3" /> Color
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={el.color}
              onChange={(e) => onUpdateElement(selectedElement, { color: e.target.value })}
              className="w-8 h-8 rounded-md cursor-pointer border border-border"
            />
            <Input
              value={el.color}
              onChange={(e) => onUpdateElement(selectedElement, { color: e.target.value })}
              className="flex-1 text-xs h-8 font-mono"
            />
          </div>
        </div>

        {/* Font Size */}
        <div>
          <Label className="text-[10px] text-muted-foreground">Font Size: {el.fontSize}px</Label>
          <Slider
            value={[el.fontSize]}
            onValueChange={([v]) => onUpdateElement(selectedElement, { fontSize: v })}
            min={8}
            max={120}
            step={1}
            className="mt-1"
          />
        </div>

        {/* Position */}
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Move className="h-3 w-3" /> Position
          </Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-[10px] text-muted-foreground">X</span>
              <Slider
                value={[el.x]}
                onValueChange={([v]) => onUpdateElement(selectedElement, { x: v })}
                min={0}
                max={scene.width}
                step={1}
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">Y</span>
              <Slider
                value={[el.y]}
                onValueChange={([v]) => onUpdateElement(selectedElement, { y: v })}
                min={0}
                max={scene.height}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Animation */}
        <div>
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-2">
            <Sparkles className="h-3 w-3" /> Animation Style
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {ANIMATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onUpdateElementAnimation(selectedElement, { type: preset.value })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  el.animation.type === preset.value
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-muted/50 hover:bg-muted"
                }`}
              >
                <span className="text-sm">{preset.emoji}</span>
                <p className="text-[11px] font-medium mt-0.5">{preset.label}</p>
                <p className="text-[9px] text-muted-foreground">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Timing */}
        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Timing
          </Label>
          <div>
            <span className="text-[10px] text-muted-foreground">Start at frame {el.animation.startFrame}</span>
            <Slider
              value={[el.animation.startFrame]}
              onValueChange={([v]) => onUpdateElementAnimation(selectedElement, { startFrame: v })}
              min={0}
              max={scene.duration}
              step={1}
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Animation length: {el.animation.duration} frames</span>
            <Slider
              value={[el.animation.duration]}
              onValueChange={([v]) => onUpdateElementAnimation(selectedElement, { duration: v })}
              min={1}
              max={300}
              step={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
