import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { getServerMemoryProvider } from "./src/brain/memory/serverMemoryProvider.js";
import { DreamMakerHubBillingError, isCentralBillingConfigured, reserveNpcAiRequest } from "./src/billing/DreamMakerHubBilling.js";

type RateBucket = { count: number; resetAt: number };

const AI_USER_AGENT = "AI-Wonderland-NPC-AI-SIM/1.0";
const rateBuckets = new Map<string, RateBucket>();

function rateLimit(maxRequests: number, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.ip || req.socket.remoteAddress || "unknown"}:${req.path}`;
    const current = rateBuckets.get(key);

    if (!current || current.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      const retryAfterSeconds = Math.max(Math.ceil((current.resetAt - now) / 1000), 1);
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      res.status(429).json({ error: "Too many requests. Try again later." });
      return;
    }

    current.count += 1;
    next();
  };
}

function stringValue(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;
}

function readGeminiApiKey(req: Request): string | null {
  const serverKey = process.env.GEMINI_API_KEY?.trim();
  if (serverKey) return serverKey;

  // Raw request keys are disabled unless an operator deliberately opts in.
  // Production BYOK should use an authenticated encrypted secret store instead.
  if (process.env.ALLOW_REQUEST_PROVIDER_KEYS !== "true") return null;
  return req.header("x-ai-provider-key")?.trim() || null;
}

function requireGemini(req: Request, res: Response): GoogleGenAI | null {
  const apiKey = readGeminiApiKey(req);
  if (!apiKey) {
    res.status(503).json({
      error: "AI provider is not configured for this deployment.",
      provider: "gemini",
      requestKeyAllowed: process.env.ALLOW_REQUEST_PROVIDER_KEYS === "true",
    });
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": AI_USER_AGENT } },
  });
}

function parseModelJson(responseText: string | undefined): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(responseText || "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Provider response is not a JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("AI provider returned invalid structured output");
  }
}

function cleanInlineData(value: string, kind: "image" | "video") {
  return value.replace(new RegExp(`^data:${kind}\\/[a-zA-Z0-9.+-]+;base64,`), "");
}

async function proxyAccountProviderCatalog(req: Request, res: Response) {
  const authorization = req.header("authorization")?.trim();
  if (!authorization) {
    res.status(401).json({ error: "Sign in to AI WONDERLAND to load account providers." });
    return;
  }

  const endpoint = process.env.DREAMMAKERHUB_PROVIDER_CATALOG_URL?.trim()
    || "https://dreammakerhub.website/api/ai-providers/catalog";

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Authorization: authorization, Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body || body.source !== "ai-wonderland-account") {
      res.status(response.status >= 400 && response.status < 500 ? response.status : 503)
        .json({ error: typeof body?.error === "string" ? body.error : "Account provider settings are unavailable." });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.json(body);
  } catch {
    res.status(503).json({ error: "AI WONDERLAND account provider settings are unavailable." });
  }
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  const smallJson = express.json({ limit: "256kb", strict: true });
  const imageJson = express.json({ limit: "16mb", strict: true });
  const videoJson = express.json({ limit: "36mb", strict: true });

  app.disable("x-powered-by");

  app.get("/api/account/providers", rateLimit(60), async (req, res) => {
    await proxyAccountProviderCatalog(req, res);
  });

  app.get('/api/account/config', rateLimit(60), (_req, res) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !publishableKey) { res.status(503).json({ error: 'Account sign-in is not configured.' }); return; }
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ url, publishableKey });
  });
  app.post('/api/account/reason', rateLimit(20), smallJson, async (req, res) => {
    const authorization = req.header('authorization') || '';
    if (!/^Bearer\s+\S+$/i.test(authorization)) { res.status(401).json({ error: 'Sign in to use your account provider.' }); return; }
    const prompt = stringValue(req.body?.prompt, 4000);
    const config = req.body?.modelConfig || {};
    const providers: Record<string, string | undefined> = {
      'AI WONDERLAND': undefined, OpenRouter: 'openrouter', Anthropic: 'anthropic',
      OpenAI: 'openai', 'Google AI': 'google', Groq: 'groq',
    };
    if (!prompt || !(config.provider in providers)) { res.status(400).json({ error: 'Choose a supported account provider and enter a prompt.' }); return; }
    const model = typeof config.model === 'string' && config.model !== 'Account default model' ? config.model : undefined;
    if (model && !/^[a-zA-Z0-9][a-zA-Z0-9._/:-]{0,119}$/.test(model)) { res.status(400).json({ error: 'Use an actual provider model ID or Account default model.' }); return; }
    try {
      const catalog = process.env.DREAMMAKERHUB_PROVIDER_CATALOG_URL || 'https://dreammakerhub.website/api/ai-providers/catalog';
      const response = await fetch(new URL('/api/ai-providers/chat', catalog), {
        method: 'POST', headers: { Authorization: authorization, 'Content-Type': 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(70000),
        body: JSON.stringify({ provider: providers[config.provider], model, messages: [{ role: 'user', content: prompt }],
          system: 'You are an advisory NPC decision service. Suggest safe intent only. Never claim an action executed; the authoritative runtime owns execution.',
          maxTokens: finiteNumber(config.maxTokens, 1024, 1, 4096), temperature: finiteNumber(config.temperature, 0.5, 0, 1), source: 'npc-ai-sim' }),
      });
      const result = await response.json();
      res.setHeader('Cache-Control', 'private, no-store');
      res.status(response.status).json(result);
    } catch { res.status(503).json({ error: 'Your account provider is unavailable.' }); }
  });

  app.post(
    "/api/gemini/npc-intelligence",
    rateLimit(20),
    smallJson,
    async (req, res) => {
      const ai = requireGemini(req, res);
      if (!ai) return;

      const prompt = stringValue(req.body?.prompt, 8_000)
        || "Analyze the current NPC context and select a safe allowed response.";
      const npcStats = typeof req.body?.npcStats === "object" && req.body.npcStats !== null
        ? req.body.npcStats as Record<string, unknown>
        : {};

      const health = finiteNumber(npcStats.health, 100, 0, 1_000_000);
      const maxHealth = finiteNumber(npcStats.maxHealth, 100, 1, 1_000_000);
      const speed = finiteNumber(npcStats.walkSpeed, 1.8, 0, 1000);
      const aiMode = stringValue(npcStats.aiMode, 64) || "Unknown";

      try {
        await reserveNpcAiRequest(req, { prompt, outputBudget: 1024, costClass: "standard" });
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            maxOutputTokens: 1024,
            systemInstruction: `You are an advisory NPC decision service. Current runtime context: HP ${health}/${maxHealth}, mode ${aiMode}, speed ${speed}m/s. Return concise structured decision metadata. Never claim an action executed; the authoritative runtime decides whether an action is allowed and whether it succeeds.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, description: "Requested runtime capability or event" },
                commandName: { type: Type.STRING, description: "Concise requested command" },
                decisionSummary: { type: Type.STRING, description: "Short user-visible reason summary, not hidden chain-of-thought" },
                recommendedAnim: { type: Type.STRING, description: "Optional animation identifier" },
                updatedAiMode: { type: Type.STRING, description: "Suggested mode only" },
                logMessage: { type: Type.STRING, description: "Concise diagnostic message" },
              },
              required: ["action", "decisionSummary", "updatedAiMode", "logMessage"],
            },
          },
        });

        res.json({ success: true, advisory: true, ...parseModelJson(response.text) });
      } catch (error) {
        console.error("[npc-intelligence] provider failure", error);
        if (error instanceof DreamMakerHubBillingError) {
          res.status(error.status).json({ error: error.message, code: "CENTRAL_BILLING" });
          return;
        }
        res.status(502).json({ error: "AI provider request failed." });
      }
    },
  );

  app.post(
    "/api/gemini/npc-vision",
    rateLimit(10),
    imageJson,
    async (req, res) => {
      const ai = requireGemini(req, res);
      if (!ai) return;

      const imageBase64 = stringValue(req.body?.imageBase64, 15_000_000);
      const mimeType = stringValue(req.body?.mimeType, 64) || "image/png";
      const prompt = stringValue(req.body?.prompt, 4_000)
        || "Analyze this NPC perception frame and return observable entities and a suggested runtime event.";
      const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

      if (!imageBase64 || !allowedMimeTypes.has(mimeType)) {
        res.status(400).json({ error: "A supported PNG, JPEG, or WebP image is required." });
        return;
      }

      try {
        await reserveNpcAiRequest(req, { prompt, outputBudget: 4096, costClass: "enhanced", mediaBytes: Buffer.byteLength(cleanInlineData(imageBase64, "image"), "base64"), mediaUnitWeight: 1 });
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: {
            parts: [
              { inlineData: { mimeType, data: cleanInlineData(imageBase64, "image") } },
              { text: prompt },
            ],
          },
          config: {
            maxOutputTokens: 4096,
            systemInstruction: "You are an advisory perception analyzer for a fictional NPC runtime. Report only observations and confidence. Suggested events/actions are advisory and must be validated by the authoritative runtime.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
                threatLevel: { type: Type.NUMBER, description: "Advisory threat estimate from 0 to 100" },
                targetType: { type: Type.STRING },
                description: { type: Type.STRING },
                triggeredEvent: { type: Type.STRING, description: "Suggested runtime event only" },
                suggestedAction: { type: Type.STRING, description: "Suggested capability only" },
              },
              required: ["detectedObjects", "threatLevel", "targetType", "description"],
            },
          },
        });

        res.json({ success: true, advisory: true, ...parseModelJson(response.text) });
      } catch (error) {
        console.error("[npc-vision] provider failure", error);
        if (error instanceof DreamMakerHubBillingError) {
          res.status(error.status).json({ error: error.message, code: "CENTRAL_BILLING" });
          return;
        }
        res.status(502).json({ error: "AI provider request failed." });
      }
    },
  );

  app.post(
    "/api/gemini/npc-video",
    rateLimit(4),
    videoJson,
    async (req, res) => {
      const ai = requireGemini(req, res);
      if (!ai) return;

      const videoBase64 = stringValue(req.body?.videoBase64, 34_000_000);
      const mimeType = stringValue(req.body?.mimeType, 64) || "video/mp4";
      const prompt = stringValue(req.body?.prompt, 4_000)
        || "Analyze this NPC perception clip and summarize observable movement and suggested runtime events.";
      const allowedMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

      if (!videoBase64 || !allowedMimeTypes.has(mimeType)) {
        res.status(400).json({ error: "A supported MP4, WebM, or QuickTime video is required." });
        return;
      }

      try {
        await reserveNpcAiRequest(req, { prompt, outputBudget: 8192, costClass: "premium", mediaBytes: Buffer.byteLength(cleanInlineData(videoBase64, "video"), "base64"), mediaUnitWeight: 1 });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: {
            parts: [
              { inlineData: { mimeType, data: cleanInlineData(videoBase64, "video") } },
              { text: prompt },
            ],
          },
          config: {
            maxOutputTokens: 8192,
            systemInstruction: "You are an advisory video perception analyzer for a fictional NPC runtime. Report observations and confidence only. The authoritative runtime owns all action execution and state changes.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                surveillanceSummary: { type: Type.STRING },
                detectedMovements: { type: Type.ARRAY, items: { type: Type.STRING } },
                threatLevel: { type: Type.NUMBER },
                keyEvents: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timestamp: { type: Type.STRING },
                      event: { type: Type.STRING },
                      threat: { type: Type.STRING },
                    },
                  },
                },
                behaviorTreeAction: { type: Type.STRING, description: "Suggested event only" },
                tacticalCommand: { type: Type.STRING, description: "Suggested command only" },
              },
              required: ["surveillanceSummary", "detectedMovements", "threatLevel"],
            },
          },
        });

        res.json({ success: true, advisory: true, ...parseModelJson(response.text) });
      } catch (error) {
        console.error("[npc-video] provider failure", error);
        if (error instanceof DreamMakerHubBillingError) {
          res.status(error.status).json({ error: error.message, code: "CENTRAL_BILLING" });
          return;
        }
        res.status(502).json({ error: "AI provider request failed." });
      }
    },
  );

  const readMemoryHealth = async () => {
    const memory = await getServerMemoryProvider().health();
    return {
      provider: memory.provider,
      connected: memory.connected,
      durable: memory.durable,
    };
  };

  app.get("/api/health", async (_req, res) => {
    try {
      const memory = await readMemoryHealth();
      res.json({
        status: "ok",
        time: new Date().toISOString(),
        subsystems: {
          memory,
          billing: {
            centralConfigured: isCentralBillingConfigured(),
          },
        },
      });
    } catch (error) {
      console.error("[health] memory health failure", error);
      res.status(503).json({ status: "degraded", time: new Date().toISOString() });
    }
  });

  app.get("/api/memory/health", rateLimit(60), async (_req, res) => {
    try {
      res.json(await readMemoryHealth());
    } catch (error) {
      console.error("[memory-health] provider failure", error);
      res.status(503).json({ connected: false, durable: false, provider: "unavailable" });
    }
  });

  // The previous contact/subscription endpoints returned simulated success without
  // actually sending mail, charging, or persisting subscriptions. They are removed
  // rather than lying to callers. A real implementation can be added behind auth.

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist/client");
    app.use(express.static(distPath));
    app.get("/*splat", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (error instanceof SyntaxError) {
      res.status(400).json({ error: "Invalid JSON request body." });
      return;
    }

    const payloadError = error as { type?: string };
    if (payloadError?.type === "entity.too.large") {
      res.status(413).json({ error: "Request body is too large." });
      return;
    }

    next(error);
  });

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`NPC-AI-SIM server listening on port ${port}`);
  });

  // The former /live-npc WebSocket emitted random viseme telemetry and AI responses
  // without an authoritative runtime. It is intentionally not mounted until the
  // versioned web↔runtime bridge exists.
  server.on("upgrade", (_request, socket) => {
    socket.destroy();
  });
}

void startServer().catch((error) => {
  console.error("Failed to start NPC-AI-SIM server", error);
  process.exitCode = 1;
});
