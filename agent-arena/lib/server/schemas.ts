import { z } from "zod";

export const startSchema = z.object({
  prompt: z.string().min(1, "Write a task first.").max(100_000),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("empty") }),
    z.object({ kind: z.literal("local-repo"), path: z.string().min(1) }),
  ]),
  config: z.object({
    agents: z
      .array(z.object({ agentId: z.enum(["claude-code", "codex", "cursor", "blackbox", "devin", "dev-fixture"]), model: z.string().max(120).optional() }))
      .min(1, "Pick at least one agent.")
      .max(10),
    parallel: z.boolean(),
    limits: z.object({
      timeoutMinutes: z.number().int().min(1).max(240),
      maxBudgetUsd: z.number().positive().max(1000).optional(),
      maxTurns: z.number().int().positive().max(1000).optional(),
    }),
    evaluation: z.object({ enabled: z.boolean(), runner: z.enum(["docker", "host-sandbox", "off"]) }),
    constraints: z.string().max(20_000),
    remote: z.object({ repo: z.string().max(200).optional(), branch: z.string().max(200).optional() }).optional(),
    context: z.object({ ids: z.array(z.string().max(80)).max(40) }).optional(),
  }),
  /** The user ticked the paid-run confirmation in the composer. */
  confirmedPaid: z.literal(true, { message: "Confirm the paid run first." }),
});

export const ratingSchema = z.object({
  dimension: z.string().min(1).max(60),
  score: z.number().int().min(1).max(5).nullable(),
  note: z.string().max(2000).optional(),
});

export const importSchema = z.object({
  patch: z.string().min(1).max(20_000_000),
  note: z.string().max(2000).default(""),
});
