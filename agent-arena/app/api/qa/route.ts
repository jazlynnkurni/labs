import { z } from "zod";
import { handler, json } from "@/lib/server/api";
import { DEFAULT_BRIEF, defaultRules } from "@/lib/qa/defaults";
import { runButtonQa } from "@/lib/qa/evaluate";
import { jevKeyPresent, jevModel } from "@/lib/qa/jev";
import { listRuns } from "@/lib/qa/store";

const runSchema = z.object({
  brief: z.string().max(4000),
  rules: z.string().max(60000),
  notes: z.string().max(4000).default(""),
  useJev: z.boolean().default(true),
});

export const GET = handler(async () => {
  return json({
    runs: listRuns(),
    jev: { keyPresent: jevKeyPresent(), model: jevModel() },
    defaults: { brief: DEFAULT_BRIEF, rules: defaultRules() },
  });
});

/** Run the Button QA pass against this server's own fixture page. */
export const POST = handler(async (req: Request) => {
  const body = runSchema.parse(await req.json());
  const origin = new URL(req.url).origin;
  const run = await runButtonQa({ ...body, fixtureUrl: `${origin}/qa/fixture/button` });
  return json({ run });
});
