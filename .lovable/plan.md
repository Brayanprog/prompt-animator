

# AI-Powered Motion Graphics Video Editor

## Overview
A browser-based video editor where users describe animations in natural language, an in-browser AI (WebLLM) converts prompts to structured scene JSON, and a Canvas renderer produces previewable/exportable motion graphics.

---

## 1. Layout & UI Structure
- **Top section**: Prompt textarea + "Generate Video" button + status indicator (loading model / generating / rendering / exporting)
- **Middle section**: HTML Canvas preview with play/pause controls
- **Bottom section**: Scene timeline showing elements and their durations, plus an editable properties panel (text content, color, font size, background color, animation type, duration)
- **Footer**: Export to video button

## 2. AI Integration (WebLLM)
- Load Qwen2.5-7B-Instruct via WebLLM in a Web Worker to avoid blocking the UI
- Show model download/loading progress bar on first use
- System prompt constrains output to the defined scene JSON schema only (no markdown, no JS, no explanations)
- Parse and validate the AI's JSON output before rendering; reject invalid responses with user feedback

## 3. Scene Schema & Validation
- Strict TypeScript types for the scene format (width, height, fps, duration, background, elements array)
- Elements support: text type with typing, fadeIn, scaleIn, and none animations
- Validation layer clamps all numbers to safe ranges, sanitizes strings, prevents malformed data

## 4. Canvas Rendering Engine
- `renderFrame(scene, frameNumber, ctx)` function handles all drawing
- Deterministic animation math:
  - **Typing**: progressively reveals characters based on frame/speed
  - **Fade in**: opacity 0→1 over duration
  - **Scale in**: scale 0.5→1 over duration
  - **None**: static rendering
- Clears and redraws every frame

## 5. Preview Player
- Plays animation using `requestAnimationFrame` at the scene's FPS
- Play/pause toggle, loops automatically
- Frame counter / progress indicator
- Renders on a visible canvas element

## 6. Editing Panel
- After AI generates a scene, all properties become editable in a side/bottom panel
- Edit text content, color, font size, background color, animation type, and duration
- Changes update the scene JSON and re-render the preview immediately

## 7. Video Export
- Renders all frames sequentially to an offscreen canvas
- Uses `canvas.captureStream()` + `MediaRecorder` to encode as WebM
- Shows export progress, disables UI during export
- Auto-downloads the resulting video file

## 8. Default Template
- If no prompt is entered, loads a default scene: dark background, centered text with typing animation, ~180 frames at 30fps
- Serves as both a demo and a starting point for editing

## 9. Safety & Architecture
- AI output is parsed as JSON only — never evaluated as code
- All values validated and clamped before rendering
- Modular code structure: AI module, renderer, player, exporter, and UI components
- Fully client-side, no backend needed

