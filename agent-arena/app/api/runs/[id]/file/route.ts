import type { NextRequest } from "next/server";
import { runs } from "@/lib/storage/repo";
import { git } from "@/lib/sandbox/workspace";
import { handler, json } from "@/lib/server/api";

/** Read one file from an agent's frozen result commit, never from the live folder. */
export const GET = handler(async (req: NextRequest, ctx: RouteContext<"/api/runs/[id]/file">) => {
  const { id } = await ctx.params;
  const run = await runs.get(id);
  if (!run?.workspaceDir || !run.resultCommit) return json({ error: "No captured result." }, { status: 404 });
  const p = req.nextUrl.searchParams.get("path") ?? "";
  if (!p) {
    const files = (await git(run.workspaceDir, ["ls-tree", "-r", "--name-only", run.resultCommit])).split("\n").filter(Boolean);
    return json({ files });
  }
  if (p.includes("..") || p.startsWith("/")) return json({ error: "Bad path" }, { status: 400 });
  const size = Number(await git(run.workspaceDir, ["cat-file", "-s", `${run.resultCommit}:${p}`], { allowFail: true })) || 0;
  if (size > 1024 * 1024) return json({ path: p, tooLarge: true, size });
  const content = await git(run.workspaceDir, ["show", `${run.resultCommit}:${p}`], { allowFail: true });
  const binary = content.includes("\u0000");
  return json({ path: p, size, binary, content: binary ? "" : content });
});
