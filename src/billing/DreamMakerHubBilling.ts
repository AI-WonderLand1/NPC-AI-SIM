import type { Request } from "express";

export type NpcAiCostClass = "standard" | "enhanced" | "premium" | "frontier";

export class DreamMakerHubBillingError extends Error {
  constructor(message: string, public readonly status = 503) {
    super(message);
    this.name = "DreamMakerHubBillingError";
  }
}

function billingEndpoint() {
  const raw = process.env.DREAMMAKERHUB_BILLING_URL?.trim() || "";
  if (!raw) throw new DreamMakerHubBillingError("Central AI WONDERLAND billing is not configured.");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new DreamMakerHubBillingError("AI WONDERLAND billing URL is invalid.");
  }

  const production = process.env.NODE_ENV === "production";
  const localHttp = !production && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new DreamMakerHubBillingError("AI WONDERLAND billing URL must use HTTPS.");
  }
  if (
    url.username || url.password || url.search || url.hash ||
    url.pathname !== "/api/internal/billing/reserve"
  ) {
    throw new DreamMakerHubBillingError(
      "AI WONDERLAND billing URL must point directly to /api/internal/billing/reserve.",
    );
  }
  return url;
}

function serviceKey() {
  const key = process.env.DREAMMAKERHUB_INTERNAL_BILLING_KEY?.trim() || "";
  if (key.length < 32) throw new DreamMakerHubBillingError("Central billing is not configured.");
  return key;
}

function authorization(req: Request) {
  const value = req.header("authorization")?.trim() || "";
  if (!/^Bearer\s+\S+$/i.test(value)) {
    throw new DreamMakerHubBillingError("Sign in to AI WONDERLAND to use platform-funded NPC AI.", 401);
  }
  return value;
}

async function reserveAiCredits(
  req: Request,
  units: number,
  costClass: NpcAiCostClass,
) {
  let response: Response;
  try {
    response = await fetch(billingEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization(req),
        "x-dmh-billing-key": serviceKey(),
      },
      body: JSON.stringify({
        source: "npc-ai-sim",
        feature: "ai_tokens",
        units,
        costClass,
      }),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error instanceof DreamMakerHubBillingError) throw error;
    throw new DreamMakerHubBillingError("Central AI WONDERLAND usage verification is unavailable.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok !== true) {
    const status = [400, 401, 402, 403, 429, 503].includes(response.status)
      ? response.status
      : 503;
    throw new DreamMakerHubBillingError(
      typeof payload?.error === "string" ? payload.error : "Central usage verification failed.",
      status,
    );
  }

  return {
    rawUnits: units,
    billedUnits: Number(payload.billedUnits || units),
    costClass,
    plan: typeof payload.plan === "string" ? payload.plan : null,
  };
}

export function estimateNpcAiUnits(input: {
  prompt: string;
  outputBudget: number;
  mediaBytes?: number;
  mediaUnitWeight?: number;
}) {
  const boundedOutput = Math.max(1, Math.min(Math.floor(input.outputBudget), 16_384));
  const promptUnits = Math.ceil(input.prompt.length / 4);
  const bytes = Math.max(0, Math.floor(input.mediaBytes || 0));
  const weight = Math.max(0, Math.floor(input.mediaUnitWeight || 0));
  const mediaUnits = bytes > 0 && weight > 0 ? Math.ceil(bytes / 1024) * weight : 0;
  return Math.max(1, promptUnits + boundedOutput + mediaUnits);
}

export async function reserveNpcAiRequest(
  req: Request,
  input: {
    prompt: string;
    outputBudget: number;
    costClass: NpcAiCostClass;
    mediaBytes?: number;
    mediaUnitWeight?: number;
  },
) {
  const units = estimateNpcAiUnits(input);
  // Reserve one customer-facing AI-credit amount. Request-rate abuse remains
  // bounded by the HTTP limiter until the main billing service exposes a
  // single atomic RPC for credits + request counters together.
  return reserveAiCredits(req, units, input.costClass);
}

export function isCentralBillingConfigured() {
  try {
    billingEndpoint();
    serviceKey();
    return true;
  } catch {
    return false;
  }
}
