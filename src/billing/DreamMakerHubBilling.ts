import type { Request } from "express";

export class DreamMakerHubBillingError extends Error {
  constructor(message: string, public readonly status = 503) {
    super(message);
    this.name = "DreamMakerHubBillingError";
  }
}

function baseUrl() {
  const raw = (process.env.DREAMMAKERHUB_BILLING_URL || "https://dreammakerhub.website").trim();
  const url = new URL(raw);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new DreamMakerHubBillingError("AI WONDERLAND billing URL must use HTTPS.");
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
  if (!/^Bearer\s+\S+/i.test(value)) {
    throw new DreamMakerHubBillingError("Sign in to AI WONDERLAND to use platform-funded NPC AI.", 401);
  }
  return value;
}

async function reserve(req: Request, feature: "ai_tokens" | "ai_requests", units: number) {
  const endpoint = new URL("/api/internal/billing/reserve", baseUrl());
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization(req),
      "x-dmh-billing-key": serviceKey(),
    },
    body: JSON.stringify({
      source: "npc-ai-sim",
      feature,
      units,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new DreamMakerHubBillingError(
      typeof payload?.error === "string" ? payload.error : "Central usage verification failed.",
      response.status,
    );
  }
}

export function estimateNpcAiTokens(prompt: string, outputBudget: number) {
  const boundedOutput = Math.max(1, Math.min(Math.floor(outputBudget), 16_384));
  return Math.max(1, Math.ceil(prompt.length / 2) + boundedOutput);
}

export async function reserveNpcAiRequest(req: Request, prompt: string, outputBudget: number) {
  const tokens = estimateNpcAiTokens(prompt, outputBudget);
  await reserve(req, "ai_requests", 1);
  await reserve(req, "ai_tokens", tokens);
  return { tokens };
}
