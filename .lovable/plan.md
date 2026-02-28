

# Fix Chat Leaking to Code Panel, AI-Driven Workflow, and Polish

## Problems Found

1. **Chat responses show in the code panel**: In `Index.tsx` line 104-107, `chatWithAI()` streams to `setStreamingCode()` which displays in both the code panel and editing panel. Chat text should only appear in the chat box.

2. **Code not stored as files**: Currently each scene holds a single `componentCode` string. There's no file/folder structure. Users want to see organized code like a real project.

3. **TTS is manual**: The voiceover section in `EditingPanel` asks the user to type a script and click "Generate Voice". It should be the AI that writes the script and generates audio automatically as part of its workflow.

4. **FPS and duration sliders clutter the UI**: Users don't use these — they just prompt. The sliders in `EditingPanel` lines 76-86 should be removed.

5. **AI has no structured workflow**: It rushes to generate visuals in one shot. It should follow: Script -> Audio -> Visuals, scene by scene.

---

## Plan

### 1. Fix Chat Streaming Leak

**In `Index.tsx`**: Add a separate `streamingChat` state for chat responses. Use `setStreamingChat` (not `setStreamingCode`) when calling `chatWithAI()`. Pass `streamingChat` to `ChatPanel` for display.

**In `ChatPanel.tsx`**: Show `streamingChat` as a live assistant message bubble (not in the code area). When streaming finishes, clear it and add the final message.

This ensures chat text only appears in the chat panel, and code streaming only appears in the code/editing panel.

### 2. Add Project File Tree

**In `scene-types.ts`**: Add a `ProjectFile` type:
```text
ProjectFile {
  path: string      // e.g. "scenes/scene-1.jsx"
  content: string   // the code
  sceneId: string   // links to a RemotionScene
}
```

Add `files: ProjectFile[]` to `VideoProject`.

**In `EditingPanel.tsx`**: Replace the raw code textarea with a simple file explorer:
- Left column: file tree showing `scenes/scene-1.jsx`, `scenes/scene-2.jsx`, `audio/voiceover-1.wav`
- Right column: code viewer for the selected file
- Each generated scene auto-creates a file entry
- Audio files appear when voiceover is generated

### 3. AI-Driven Voiceover (Not Manual)

**Remove** the manual voiceover text input and "Generate Voice" button from `EditingPanel`.

**In `ai.ts`**: The AI already outputs a `voiceoverText` field. After scene generation, automatically:
1. Extract `voiceoverText` from the AI output
2. Call `generateVoiceover(voiceoverText)` from `tts.ts`
3. Attach the audio URL to the scene

**In `Index.tsx`**: After `generateSceneStreaming()` returns, check for `result.voiceoverText`. If present, set status to `"generating-voice"`, call TTS, then attach audio to the scene. Show progress in chat.

### 4. Remove FPS/Duration Sliders

**In `EditingPanel.tsx`**: Remove the entire "Composition info" section (lines 70-87) with FPS slider and duration slider. Keep only:
- Scene name and duplicate/delete buttons
- File tree + code viewer
- Read-only info line showing dimensions and duration

### 5. AI Workflow: Script -> Audio -> Visuals

**In `ai.ts`**: Add a new `generateVideoWorkflow()` function that orchestrates:

**Step 1 — Script**: Ask the AI to write a video script with scene breakdowns:
```text
System: "Write a video script. Output JSON: { scenes: [{ title, narration, visualDescription, durationSeconds }] }"
```
Stream this to chat so user sees the plan.

**Step 2 — Audio**: For each scene's narration text, call `generateVoiceover()`. Show progress in chat.

**Step 3 — Visuals**: For each scene, call `generateSceneStreaming()` with the visual description as prompt and the duration from the script. Stream code to the code panel.

**Step 4 — Assembly**: Add all scenes to the project in order. Each scene knows its position in the timeline.

**In `Index.tsx`**: When the user's prompt is a "generate" intent, call `generateVideoWorkflow()` instead of `generateSceneStreaming()` directly. The workflow function accepts callbacks for updating chat messages, streaming code, and progress.

**In `ChatPanel.tsx`**: Show workflow steps as status messages:
- "Writing script..." with the script preview
- "Generating voiceover for scene 1..." 
- "Creating visuals for scene 1..."
- "Done! 3 scenes created."

### 6. Simplify Sidebar

**In `SidebarNav.tsx`**: Remove "Media" tab (composition info moves into a collapsible section of the editing panel). Keep: New, Projects, Chat, Code.

---

## Technical Details

### New streaming states (Index.tsx)
```text
const [streamingChat, setStreamingChat] = useState("");  // for chat replies
const [streamingCode, setStreamingCode] = useState("");  // for code generation only
const [workflowStep, setWorkflowStep] = useState("");    // "script" | "audio" | "visuals" | ""
```

### Workflow function signature (ai.ts)
```text
interface WorkflowCallbacks {
  onScriptToken: (text: string) => void;
  onCodeToken: (code: string) => void;
  onStepChange: (step: string, detail: string) => void;
  onSceneReady: (scene: RemotionScene) => void;
  fps: number;
}

async function generateVideoWorkflow(
  prompt: string,
  callbacks: WorkflowCallbacks
): Promise<RemotionScene[]>
```

### Script generation prompt (ai.ts)
```text
"You are a video scriptwriter. Given a topic, write a structured script.
Output ONLY a JSON array:
[{ "title": "...", "narration": "...", "visualDescription": "...", "durationSeconds": N }]
Each scene should be 3-10 seconds. Total should match user's requested duration.
DO NOT output anything except the JSON array."
```

### ProjectFile type (scene-types.ts)
```text
interface ProjectFile {
  id: string;
  path: string;        // "scenes/intro.jsx"
  content: string;     // component code
  sceneId?: string;    // links to RemotionScene
  type: "scene" | "audio" | "config";
}
```

### File tree in EditingPanel
```text
scenes/
  scene-1-intro.jsx        <- click to view code
  scene-2-features.jsx
audio/
  voiceover-1.wav          <- shows audio player
  voiceover-2.wav
```

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/scene-types.ts` | Add `ProjectFile`, add `files` to `VideoProject` |
| `src/lib/ai.ts` | Add `generateVideoWorkflow()`, add script generation prompt |
| `src/pages/Index.tsx` | Separate `streamingChat` from `streamingCode`, workflow integration, auto-TTS |
| `src/components/ChatPanel.tsx` | Show `streamingChat` as live bubble, show workflow steps |
| `src/components/EditingPanel.tsx` | Remove sliders, add file tree, remove manual voiceover input |
| `src/components/SidebarNav.tsx` | Remove "Media" tab |
| `src/components/TimelinePanel.tsx` | Minor: auto-update when workflow adds scenes |

