import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { artifacts } from "@/lib/storage/repo";
import { safeDataPath } from "@/lib/storage/paths";
import { handler, json } from "@/lib/server/api";

const TYPES: Record<string, string> = { ".png": "image/png", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".jsonl": "text/plain; charset=utf-8", ".patch": "text/plain; charset=utf-8" };

export const GET = handler(async (req: NextRequest, ctx: RouteContext<"/api/artifacts/[id]">) => {
  const { id } = await ctx.params;
  const art = await artifacts.get(id);
  if (!art) return json({ error: "Not found" }, { status: 404 });
  const rel = req.nextUrl.searchParams.get("full") === "1" && typeof art.meta.full === "string" ? art.meta.full : art.path;
  const file = safeDataPath(rel);
  if (!fs.existsSync(file)) return json({ error: "File missing" }, { status: 404 });
  return new Response(fs.readFileSync(file), {
    headers: { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "private, max-age=60", "X-Content-Type-Options": "nosniff" },
  });
});
