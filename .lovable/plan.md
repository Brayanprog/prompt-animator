

# Integrate Remotion into JavaMotion

## What Changes
Replace the custom Canvas renderer with **Remotion's `@remotion/player`** for in-browser preview and keep the existing `MediaRecorder` export as a browser-side fallback. The AI will generate **React component code** (JSX) that Remotion renders, enabling shapes, motion paths, and complex animations -- not just text.

## Why This Works Without a Backend
Remotion's `@remotion/player` is a pure React component that renders animations in the browser. No Node.js server needed for preview. Export stays browser-side using canvas capture. Lovable Cloud is **not required** for this step.

---

## Architecture Overview

```text
User Prompt --> WebLLM AI --> React/JSX code string --> eval'd as Remotion Composition --> @remotion/player
```

Instead of generating a JSON scene, the AI will generate a **React component string** that uses Remotion's `useCurrentFrame()` and `interpolate()` APIs. This component gets dynamically rendered inside `@remotion/player`.

---

## Step-by-Step Plan

### 1. Install Remotion dependencies
Add `remotion` and `@remotion/player` packages.

### 2. Update Scene Types (`src/lib/scene-types.ts`)
- Add a new `RemotionScene` type that stores: `componentCode` (string of React/JSX), `width`, `height`, `fps`, `durationInFrames`, and `metadata` (title, description).
- Keep the old `Scene` type for backward compatibility with existing saved projects.

### 3. Create a Remotion Composition renderer (`src/lib/remotion-renderer.tsx`)
- A function that takes a React component code string and safely evaluates it into a renderable React component.
- Uses `new Function()` with Remotion's `useCurrentFrame`, `useVideoConfig`, `interpolate`, and `spring` passed as arguments -- so the AI-generated code can reference them.
- Wraps execution in try/catch with a fallback error display.

### 4. Update AI prompt and generation (`src/lib/ai.ts`)
- Change the system prompt to instruct the AI to generate React component code using Remotion APIs (`useCurrentFrame()`, `interpolate()`, `spring()`).
- The AI output will be a JSON object: `{ code: "...", width, height, fps, durationInFrames }`.
- Parse and validate the output, extracting the component code string.

### 5. Replace VideoPreview (`src/components/VideoPreview.tsx`)
- Replace the canvas-based player with `@remotion/player`'s `<Player>` component.
- Pass the dynamically created Remotion composition as the `component` prop.
- Wire up play/pause/seek controls to the Player's ref API.
- Keep the progress bar and transport controls.

### 6. Update the usePlayer hook (`src/hooks/use-player.ts`)
- Adapt to work with Remotion's Player ref (`playerRef.current.play()`, `.pause()`, `.seekTo()`).
- Remove Canvas-specific rendering logic.

### 7. Update exporter (`src/lib/exporter.ts`)
- For now, keep using `MediaRecorder` + canvas capture by rendering the Player's iframe/DOM to a canvas.
- Alternatively, use Remotion Player's built-in `renderToCanvas` if available, or capture via `html2canvas` approach.

### 8. Update EditingPanel (`src/components/EditingPanel.tsx`)
- Show the generated code in an editable text area so users can tweak it.
- Add basic property controls (width, height, fps, duration, background color) that modify the composition wrapper.
- Keep element-level sliders for when the scene uses the legacy JSON format.

### 9. Update CodePanel (`src/components/CodePanel.tsx`)
- Display the actual React/JSX code the AI generated (instead of JSON).
- Add copy-to-clipboard functionality.

### 10. Update MediaPanel, TimelinePanel
- MediaPanel: Show composition metadata (dimensions, fps, duration, element count parsed from code).
- TimelinePanel: Show a single composition track with the playhead synced to the Remotion Player's current frame.

### 11. Fix the current UI bug
- Fix the error visible in the screenshot (likely related to the current canvas/player initialization).

---

## Technical Details

### Remotion Component Evaluation
The AI generates code like:
```text
const { useCurrentFrame, interpolate, spring, useVideoConfig } = Remotion;

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const ballY = interpolate(
  Math.sin(frame * 0.1) * 30,
  [-30, 30], [200, 400]
);

return (
  <div style={{ flex: 1, background: '#1a1a2e' }}>
    <div style={{
      width: 50, height: 50, borderRadius: '50%',
      background: 'red',
      position: 'absolute',
      left: interpolate(frame, [0, 90], [100, 600]),
      top: ballY,
    }} />
  </div>
);
```

This gets wrapped in a function component and passed to `<Player component={DynamicComp} />`.

### What the AI Can Now Generate
- Bouncing balls, spinning shapes, particle effects
- Multi-element scenes with staggered animations
- CSS-based gradients, shadows, transforms
- SVG shapes and paths
- Any React-renderable content

### Export Strategy
Browser-side export using the existing `MediaRecorder` approach, capturing the Player's rendered output. This produces `.webm` files. Full MP4 rendering would require a backend (future Lovable Cloud integration).

### Files Modified
| File | Action |
|------|--------|
| `package.json` | Add `remotion`, `@remotion/player` |
| `src/lib/scene-types.ts` | Add `RemotionScene` type |
| `src/lib/remotion-renderer.tsx` | New -- dynamic component evaluator |
| `src/lib/ai.ts` | New system prompt for React/JSX output |
| `src/lib/renderer.ts` | Keep for legacy, add deprecation note |
| `src/lib/scene-validation.ts` | Add Remotion scene validation |
| `src/components/VideoPreview.tsx` | Replace canvas with `<Player>` |
| `src/hooks/use-player.ts` | Adapt to Remotion Player ref |
| `src/lib/exporter.ts` | Adapt capture for Remotion output |
| `src/components/EditingPanel.tsx` | Add code editor, adapt controls |
| `src/components/CodePanel.tsx` | Show JSX instead of JSON |
| `src/components/MediaPanel.tsx` | Show composition metadata |
| `src/components/TimelinePanel.tsx` | Sync with Remotion player |
| `src/lib/default-scene.ts` | Update default to Remotion format |
| `src/pages/Index.tsx` | Wire up new types and flow |

