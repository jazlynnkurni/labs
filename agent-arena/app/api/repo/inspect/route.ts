import type { NextRequest } from "next/server";
import { inspectRepo } from "@/lib/sandbox/workspace";
import { handler, json } from "@/lib/server/api";

/** Read-only look at a local repository before using it as the starting point. */
export const GET = handler(async (req: NextRequest) => {
  const p = req.nextUrl.searchParams.get("path")?.trim();
  if (!p) return json({ error: "Give a folder path." }, { status: 400 });
  const expanded = p.startsWith("~/") ? `${process.env.HOME}/${p.slice(2)}` : p;
  const info = await inspectRepo(expanded);
  return json({ ...info, remote: info.remote ? info.remote.replace(/\/\/[^@/]+@/, "//") : undefined });
});
