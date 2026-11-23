import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { dataDir } from "@/lib/storage/paths";
import type { JevAnswer } from "./types";

/**
 * Server-only client for the Jev decision API (thejevai.com, POST /v1/systemone).
 * The key is read from the environment and never logged, stored, returned or sent to the browser.
 * Answers are cached by model, state and question, so an identical judgment is never paid for twice.
 */

export interface JevQuestion {
  type: "choice" | "score" | "noul";
  instructions: string;
  criteria?: Record<string, string> | string[];
}

/** The service allows 8 questions and 32 KiB of JSON per request. */
export const JEV_MAX_QUESTIONS = 8;
export const JEV_MAX_BYTES = 32 * 1024;

export const jevModel = () => process.env.JEV_MODEL?.trim() || "typesafe/jev-1.13";
export const jevKeyPresent = () => Boolean(process.env.JEV_API_KEY?.trim());
const jevBase = () => (process.env.JEV_API_BASE_URL?.trim() || "https://thejevai.com").replace(/\/+$/, "");

const cacheFile = () => path.join(dataDir(), "qa", "jev-cache.json");
function readCache(): Record<string, JevAnswer> {
  try {
    return JSON.parse(fs.readFileSync(cacheFile(), "utf8"));
  } catch {
    return {};
  }
}
function writeCache(cache: Record<string, JevAnswer>) {
  fs.mkdirSync(path.dirname(cacheFile()), { recursive: true });
  fs.writeFileSync(cacheFile(), JSON.stringify(cache));
}
const keyFor = (model: string, state: unknown, q: JevQuestion) =>
  createHash("sha256").update(JSON.stringify([model, state, q])).digest("hex");

export interface JevBatchResult {
  answers: Record<string, { answer: JevAnswer; cached: boolean }>;
  requests: number;
  cachedRequests: number;
  creditsUsed: number;
}

/** A failed Jev call; `requests` says how many requests reached the service before it failed. */
export class JevError extends Error {
  requests = 0;
}

/** Ask independent questions about one state. Only uncached questions go over the network, 8 per request. */
export async function askJev(state: unknown, questions: Record<string, JevQuestion>): Promise<JevBatchResult> {
  const model = jevModel();
  const cache = readCache();
  const out: JevBatchResult = { answers: {}, requests: 0, cachedRequests: 0, creditsUsed: 0 };
  const pending: [string, JevQuestion][] = [];
  for (const [id, q] of Object.entries(questions)) {
    const hit = cache[keyFor(model, state, q)];
    if (hit) out.answers[id] = { answer: hit, cached: true };
    else pending.push([id, q]);
  }
  if (!pending.length) {
    if (Object.keys(questions).length) out.cachedRequests = 1;
    return out;
  }
  const key = process.env.JEV_API_KEY?.trim();
  if (!key) throw new JevError("No JEV_API_KEY in the server environment.");

  for (let i = 0; i < pending.length; i += JEV_MAX_QUESTIONS) {
    const chunk = pending.slice(i, i + JEV_MAX_QUESTIONS);
    const body = JSON.stringify({ model, state, questions: Object.fromEntries(chunk) });
    if (Buffer.byteLength(body) > JEV_MAX_BYTES) throw new JevError(`Request is ${Buffer.byteLength(body)} bytes; Jev allows ${JEV_MAX_BYTES}. Trim the state.`);
    const res = await fetch(`${jevBase()}/v1/systemone`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    out.requests++;
    if (!res.ok) throw Object.assign(new JevError(statusMessage(res.status)), { requests: out.requests });
    const env = (await res.json()) as { code?: number; message?: string; data?: { result?: { answers?: Record<string, JevAnswer> }; creditsUsed?: number } };
    if (env.code !== 0) throw new JevError(`Jev returned code ${env.code}: ${String(env.message ?? "").slice(0, 160)}`);
    const answers = env.data?.result?.answers;
    if (!answers) throw new JevError("Jev response had no answers.");
    out.creditsUsed += env.data?.creditsUsed ?? 0;
    for (const [id, q] of chunk) {
      const a = answers[id];
      if (!a) continue;
      cache[keyFor(model, state, q)] = a;
      out.answers[id] = { answer: a, cached: false };
    }
  }
  writeCache(cache);
  return out;
}

function statusMessage(status: number) {
  if (status === 401) return "Jev rejected the key (401). Check JEV_API_KEY in .env.local.";
  if (status === 402) return "Jev account is out of credits (402).";
  if (status === 422 || status === 400) return `Jev rejected the request (${status}): a question or the model id is invalid.`;
  if (status === 429 || status === 529) return `Jev is rate limited or busy (${status}). Try again shortly.`;
  return `Jev request failed (${status}).`;
}
