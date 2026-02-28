

# Fix Code Persistence, Duration Control, Editable Timeline, Conversational AI, and Voiceover

## Problems to Fix

1. **Code overwrites instead of building on previous**: Each generation replaces the entire scene. The AI has no memory of previous code -- it starts fresh every time.
2. **Duration mismatch**: User asks for "20 second video" but gets 6 seconds. The AI prompt doesn't extract or enforce the requested duration.
3. **Properties and clips not editable**: Timeline clips can't be selected, deleted, copied, or reordered. The properties panel sliders work but aren't connected to meaningful editing.
4. **AI doesn't converse**: It generates code immediately instead of asking clarifying questions or discussing the video concept.
5. **No voiceover**: User wants TTS audio synced to the video.

---

## Plan

### 1. Multi-Scene Project Model (Code Persistence)

Replace the single `RemotionScene` with a **project** that holds multiple scenes/clips:

```text
Project
  - scenes: RemotionScene[]     (ordered list of scenes)
  - activeSceneIndex: number    (which scene is being edited)
  - globalSettings: { width, height, fps }
```

**In `scene-types.ts`**: Add a `VideoProject` type with a `scenes` array. Each scene gets an `id`, `name`, `componentCode`, `durationInFrames`, and optional `voiceover` field.

**In `use-scene-editor.ts`**: Track `scenes[]` and `activeSceneIndex`. Add `addScene()`, `removeScene()`, `duplicateScene()`, `updateScene(index, partial)`, `reorderScenes()`.

**In `ai.ts`**: When generating, pass the current scene's code as context in the prompt so the AI can modify it rather than replacing it:
```text
"Here is the current code for this scene:\n{existingCode}\n\nUser wants: {prompt}\n\nModify the code to incorporate the changes."
```

### 2. Duration-Aware Generation

**In `ai.ts`**: Before calling the AI, parse the user prompt for duration hints ("20 seconds", "1 minute", "30s"). Calculate `durationInFrames = seconds * fps` and inject it into the system prompt:

```text
"The user requested a {X} second video. Set durationInFrames to {X * fps}."
```

Also update the system prompt to emphasize: "Use the FULL duration. Animate across ALL frames, not just the first few seconds."

### 3. Conversational AI Mode

**In `ai.ts`**: Add a `chatWithAI()` function separate from `generateSceneStreaming()`. This function uses a conversational system prompt that tells the AI to:
- Ask clarifying questions about the video (tone, style, target audience, key messages)
- Only generate code when the user says "generate" or "create it" or when enough info is gathered
- Suggest improvements after generation

**In `Index.tsx`**: Detect intent from user message:
- If message contains action words ("create", "make", "generate", "build"), call `generateSceneStreaming()`
- Otherwise, call `chatWithAI()` for conversation
- Pass full message history to both functions for context

**In `ChatPanel.tsx`**: The suggestions after generation become smarter -- based on what's actually in the scene (parsed from the code).

### 4. Editable Timeline Clips

**In `TimelinePanel.tsx`**:
- Add click-to-select on clips (highlight selected clip, show selection border)
- Right-click or action buttons: Delete, Duplicate, Rename
- Drag to reorder clips (basic drag handler using mouse events)
- Each clip maps to a scene in the project's `scenes[]` array
- Clicking a clip switches `activeSceneIndex` and loads that scene in the preview + code editor

**In `EditingPanel.tsx`**:
- Show which scene is active (scene name, index)
- Copy code button
- Delete scene button
- Properties (FPS, duration) apply to the active scene

### 5. Browser-Side Voiceover with Xenova/Transformers.js

**New file `src/lib/tts.ts`**:
- Use `@huggingface/transformers` (the newer package name for xenova/transformers) with the `Xenova/speecht5_tts` model
- Export `generateVoiceover(text: string, onProgress): Promise<AudioBuffer>`
- The pipeline runs entirely in the browser using ONNX Runtime
- Model downloads on first use (~100MB), cached after that

**In `scene-types.ts`**: Add to RemotionScene:
```text
voiceover?: {
  text: string;
  audioUrl: string;  // blob URL of generated audio
}
```

**In `VideoPreview.tsx`**: Play the audio blob in sync with the Remotion Player using an `<audio>` element that starts/stops/seeks in sync with the player's frame events.

**In `TimelinePanel.tsx`**: Show a second track row for audio/voiceover clips beneath the video clips.

**In `EditingPanel.tsx`**: Add a "Voiceover" section where users can type text, click "Generate Voice", hear a preview, and attach it to the active scene.

**In `ai.ts`**: When the AI generates a scene, it can also suggest voiceover text in its JSON output:
```text
{"code":"...", "voiceover": "Welcome to OpenClaw...", "durationInFrames": 600, ...}
```

### 6. Updated AI System Prompt

The prompt will be restructured to:
- Accept conversation history as context
- Know the current scene code (for modifications)
- Respect user-specified duration
- Output voiceover text alongside code
- Use React.createElement (no JSX)

---

## Technical Details

### Duration parsing (ai.ts)
```text
function parseDuration(prompt: string, fps: number): number | null {
  const match = prompt.match(/(\d+)\s*(second|sec|s|minute|min|m)\b/i);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const seconds = unit.startsWith("m") ? num * 60 : num;
  return seconds * fps;
}
```

### Conversation vs generation detection (Index.tsx)
```text
const ACTION_WORDS = /\b(create|make|generate|build|animate|design|show|render)\b/i;
const isGenerateIntent = ACTION_WORDS.test(userMessage);
```

### TTS pipeline (tts.ts)
```text
import { pipeline } from "@huggingface/transformers";

let synthesizer = null;

export async function generateVoiceover(text, onProgress) {
  if (!synthesizer) {
    synthesizer = await pipeline("text-to-speech", "Xenova/speecht5_tts", {
      progress_callback: onProgress
    });
  }
  const result = await synthesizer(text, { speaker_embeddings: "..." });
  // Convert to blob URL
  const blob = new Blob([result.audio], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}
```

### Audio sync with Remotion Player (VideoPreview.tsx)
```text
// On frameupdate event:
const audioTime = frame / fps;
if (Math.abs(audioEl.currentTime - audioTime) > 0.1) {
  audioEl.currentTime = audioTime;
}
// On play: audioEl.play()
// On pause: audioEl.pause()
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/lib/tts.ts` | Browser-side TTS using Xenova/speecht5_tts |

### Files to Modify
| File | Change |
|------|--------|
| `package.json` | Add `@huggingface/transformers` |
| `src/lib/scene-types.ts` | Add `VideoProject` type, voiceover fields |
| `src/lib/ai.ts` | Conversational mode, duration parsing, context-aware generation, voiceover text output |
| `src/hooks/use-scene-editor.ts` | Multi-scene project management (add/remove/reorder scenes) |
| `src/pages/Index.tsx` | Multi-scene state, conversation vs generation routing, voiceover integration |
| `src/components/VideoPreview.tsx` | Audio sync with player |
| `src/components/EditingPanel.tsx` | Active scene display, voiceover text input, copy/delete buttons |
| `src/components/TimelinePanel.tsx` | Selectable/deletable clips, audio track, drag reorder |
| `src/components/ChatPanel.tsx` | Pass message history, show conversation vs generation states |

