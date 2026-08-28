# NPC-AI-SIM

**Universal web-native pipeline for AI NPCs** — Build, configure, and deploy intelligent 3D NPCs powered by Google Gemini AI.

## Overview

WonderPlay 3D is a complete platform for creating AI-driven NPCs (Non-Player Characters) that run in the browser. It combines:

- **Gemini AI Intelligence** — Tactical reasoning, visual perception, and video reconnaissance
- **Real-time 3D Rendering** — Three.js/WebGL scenes with multi-NPC support
- **Visual Behavior Editor** — Node-based AI configuration (drag-and-drop)
- **Voice Synthesis** — Multi-provider TTS with spatial audio & subtitles
- **Asset Library** — Pre-built NPC templates with personalities & stats

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│   NPC-AI-SIM / AI WONDERLAND INNOVATION Platform           │
├──────────────────┬──────────────────┬──────────────────────┤
│   Frontend       │   Backend        │   AI Services        │
│   (React + TS)   │   (Express + WS) │   (Google Gemini)    │
├──────────────────┼──────────────────┼──────────────────────┤
│ • Library Page   │ • /api/gemini/   │ • gemini-3.6-flash   │
│ • Builder Page   │   npc-intelligence│   (text reasoning)  │
│ • 3D Viewport    │ • /api/gemini/   │ • gemini-3.6-flash   │
│ • Behavior Graph │   npc-vision     │   (image analysis)   │
│ • Voice Config   │ • /api/gemini/   │ • gemini-3.1-pro     │
│ • Subtitle Sys   │   npc-video      │   (video analysis)   │
└──────────────────┴──────────────────┴──────────────────────┘
```

## Key Features

### 🧠 AI-Powered NPC Intelligence
- **Tactical Reasoning** — NPCs analyze context, stats, and behavior state to choose actions
- **Visual Perception** — Image analysis for threat detection, entity recognition
- **Video Reconnaissance** — Surveillance clip analysis for patrol/squad coordination
- **Behavior Trees** — Event-driven state machines (patrol, guard, attack, retreat, etc.)

### 🎮 3D Builder Interface
- Real-time Three.js viewport with multi-NPC scenes
- Drag-and-drop asset library (humanoids, creatures, vehicles, props)
- Transform gizmos (move, rotate, scale)
- Inspector panel for AI config, personality, voice settings
- Keyboard shortcuts (V/G/R/S/B/A)

### 🎤 Voice & Audio System
- Multi-provider: ElevenLabs, Browser TTS, OpenAI, Azure
- Spatial 3D audio with distance attenuation
- Real-time subtitles with emotion-aware styling
- Voice customization: pitch, speed, tone, emotion, speaking style

### 📦 NPC Template Library
Pre-configured templates with:
- **Guardian Knight** — Tactical combat, patrol behavior
- **Wandering Merchant** — Dynamic trading, dialogue memory
- **Shadow Beast** — Pack hunting, flanking AI
- **Scout Drone** — Aerial recon, computer vision
- **Village Elder** — Quest/dialogue system
- **Automated Sentry** — Networked defense, threat prioritization

## Quick Start

### Prerequisites
- Node.js 20+

### Installation

```bash
# Clone and install dependencies
cd NPC-AI-SIM
npm install

# Configure environment
cp .env.example .env
```

### Development

```bash
# Start dev server (Vite + Express on port 3000)
npm run dev
```

Open http://localhost:3000 — starts at the **Library** page. Click "Launch Builder" to access the 3D editor (requires subscription).

### Production Build

```bash
# Build client + server
npm run build

# Start production server
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gemini/npc-intelligence` | POST | Tactical reasoning for NPC behavior decisions |
| `/api/gemini/npc-vision` | POST | Image analysis from NPC camera sensor |
| `/api/gemini/npc-video` | POST | Video reconnaissance analysis |
| `/api/health` | GET | Health check |
| `/api/contact` | POST | Contact form submission |
| `/api/subscriptions/*` | POST/GET/DELETE | Subscription management |
| `/live-npc` | WS | Real-time NPC WebSocket (visemes, dialogue) |

### Example: NPC Intelligence Request

```bash
curl -X POST http://localhost:3000/api/gemini/npc-intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Player approaches with weapon drawn",
    "npcStats": { "health": 150, "maxHealth": 200, "aiMode": "Patrol", "walkSpeed": 1.8 },
    "behaviorNodes": ["patrol", "investigate", "engage"],
    "apiKey": "YOUR_GEMINI_KEY"
  }'
```

Response:
```json
{
  "success": true,
  "action": "player_spotted",
  "commandName": "Charge Attack",
  "aiThought": "Hostile detected. Initiating combat protocol.",
  "recommendedAnim": "anim_run",
  "updatedAiMode": "Aggressive",
  "logMessage": "[NPC] Guardian Knight: Player spotted at 12m. Switching to Aggressive mode. Charging."
}
```

## Project Structure

```
wonderplay-3D/
├── src/
│   ├── components/
│   │   ├── builder/          # Builder page components
│   │   │   ├── LeftPanel/    # Asset browser, details
│   │   │   ├── RightPanel/   # Behavior graph editor
│   │   │   ├── Pipeline/     # Reality capture, stats
│   │   │   └── ...
│   │   ├── LibraryPage.tsx   # NPC template library
│   │   ├── BuilderPage.tsx   # 3D editor viewport
│   │   ├── Scene3D.tsx       # Three.js scene wrapper
│   │   └── ...
│   ├── *.ts                  # Core systems (AI, voice, subtitles, etc.)
│   ├── App.tsx               # Router + navigation
│   └── main.tsx              # Entry point
├── server.ts                 # Express + WebSocket server
├── vite.config.ts            # Vite configuration
├── package.json
└── tsconfig.json
```

## Core Systems

| File | Purpose |
|------|---------|
| `NPCEvents.ts` | Behavior tree event definitions |
| `DialogueManager.ts` | Conversation flow & context |
| `VoiceComponent.ts` | NPC voice synthesis integration |
| `SubtitleSystem.ts` | Real-time subtitle rendering |
| `AnimationSync.ts` | Animation/viseme synchronization |
| `AISafetyValidator.ts` | Content safety for AI outputs |
| `websocketBrain.ts` | WebSocket message handling |
| `gltfCompiler.ts` | GLTF export pipeline |

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=3000
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Three.js, React Router
- **Backend**: Express 5, WebSocket (ws), Google GenAI SDK
- **AI**: Google Gemini 3.6 Flash / 3.1 Pro
- **3D**: Three.js, three-stdlib, @gltf-transform/core
- **Animation**: Motion (Framer Motion)
- **Icons**: Lucide React

## License

MIT

