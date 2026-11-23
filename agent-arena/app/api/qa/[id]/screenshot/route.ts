import fs from "node:fs";
import path from "node:path";
import { handler, json } from "@/lib/server/api";
import { getRun, qaDir } from "@/lib/qa/store";

/** The fixture screenshot for one run, served only from the QA artifacts folder. */
export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/qa/[id]/screenshot">) => {
  const { id } = await ctx.params;
  const run = getRun(id);
  const file = run?.evidence.screenshot;
  const root = path.join(qaDir(), "artifacts") + path.sep;
  if (!file || !path.resolve(file).startsWith(root) || !fs.existsSync(file)) return json({ error: "Not found" }, { status: 404 });
  return new Response(fs.readFileSync(file), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
});
