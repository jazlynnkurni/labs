import { NextResponse, type NextRequest } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The arena can start paid agent runs, so its API only answers this app.
 * - Host must be local (blocks DNS rebinding from a web page).
 * - Anything that changes state must come from this app's own origin. Agent
 *   previews run on other ports inside sandboxed iframes, so they cannot.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.replace(/:\d+$/, "");
  if (!LOCAL_HOSTS.has(hostname)) {
    return NextResponse.json({ error: "Agent Arena only answers on localhost." }, { status: 403 });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== host) {
      return NextResponse.json({ error: "Cross-origin request refused." }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
