import type { NextRequest } from "next/server";
import { events } from "@/lib/storage/repo";
import { subscribe } from "@/lib/orchestration/bus";
import { handler } from "@/lib/server/api";

/**
 * Server-Sent Events. Replays stored events after Last-Event-ID (or ?after=)
 * from SQLite, then streams new ones live. Reconnects lose nothing.
 */
export const GET = handler(async (req: NextRequest, ctx: RouteContext<"/api/experiments/[id]/events">) => {
  const { id } = await ctx.params;
  const after = Number(req.headers.get("last-event-id") ?? req.nextUrl.searchParams.get("after") ?? 0) || 0;
  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      let lastId = after;
      const send = (e: { id: number }) => {
        if (e.id <= lastId) return;
        lastId = e.id;
        try {
          controller.enqueue(encoder.encode(`id: ${e.id}\ndata: ${JSON.stringify(e)}\n\n`));
        } catch {
          /* closed */
        }
      };
      const buffered: { id: number }[] = [];
      let replaying = true;
      unsubscribe = subscribe(id, (e) => (replaying ? buffered.push(e) : send(e)));
      for (;;) {
        const batch = await events.since(id, lastId, 2000);
        batch.forEach(send);
        if (batch.length < 2000) break;
      }
      replaying = false;
      buffered.sort((a, b) => a.id - b.id).forEach(send);
      controller.enqueue(encoder.encode(`event: ready\ndata: {}\n\n`));
      ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 15_000);
    },
    cancel() {
      unsubscribe();
      if (ping) clearInterval(ping);
    },
  });
  req.signal.addEventListener("abort", () => {
    unsubscribe();
    if (ping) clearInterval(ping);
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
});
