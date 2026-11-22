import fs from "node:fs";
import { artifacts } from "@/lib/storage/repo";
import { safeDataPath } from "@/lib/storage/paths";
import { handler, json } from "@/lib/server/api";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/runs/[id]/diff">) => {
  const { id } = await ctx.params;
  const art = (await artifacts.forRun(id)).find((a) => a.kind === "diff");
  if (!art) return json({ error: "No diff captured yet." }, { status: 404 });
  const file = safeDataPath(art.path);
  const size = fs.statSync(file).size;
  const limit = 3 * 1024 * 1024;
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(Math.min(size, limit));
  fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  return new Response(buf.toString("utf8"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Truncated": size > limit ? "1" : "0", "X-Size": String(size) },
  });
});
