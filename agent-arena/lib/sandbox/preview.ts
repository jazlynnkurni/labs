import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { execIn, stopDocker, type ExecRunner } from "./exec";
import { readProject } from "@/lib/evaluation/project";

export interface Preview {
  runId: string;
  port: number;
  url: string;
  kind: "static" | "script";
  runner: ExecRunner | "static";
  startedAt: number;
  logs: string[];
  /** Set when the arena served static files because the app's own script did not answer. */
  note?: string;
  stop: () => Promise<void>;
}

const g = globalThis as unknown as { __arenaPreviews?: Map<string, Preview> };
const previews = (g.__arenaPreviews ??= new Map());

const IDLE_MS = 30 * 60_000;

export async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

/** Serve files read-only. Serving static files executes nothing from the workspace. */
function staticServer(root: string, port: number) {
  const base = fs.realpathSync(root);
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://x");
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith("/")) rel += "index.html";
      const abs = path.resolve(base, "." + rel);
      if (abs !== base && !abs.startsWith(base + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      if (abs.includes(`${path.sep}.git${path.sep}`) || abs.includes(`${path.sep}.arena${path.sep}`)) {
        res.writeHead(404).end();
        return;
      }
      // Single-page-app fallback only for route-like paths. A missing asset is a real 404.
      const exists = fs.existsSync(abs) && fs.statSync(abs).isFile();
      const file = exists ? abs : path.extname(abs) ? "" : path.join(base, "index.html");
      if (!file || !fs.existsSync(file)) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(500).end();
    }
  });
  return new Promise<http.Server>((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

export async function waitForHttp(url: string, timeoutMs: number, signal?: AbortSignal) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end && !signal?.aborted) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: "manual" });
      if (res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

/**
 * Start (or reuse) a preview of one agent's workspace. Static output is served
 * by the arena itself; anything that needs a script runs inside the sandbox
 * runner, bound to 127.0.0.1 only.
 */
export async function startPreview(runId: string, workspace: string, runner: ExecRunner, opts: { timeoutMs?: number } = {}): Promise<Preview> {
  const existing = previews.get(runId);
  if (existing) return existing;
  const info = readProject(workspace);
  if (!info.serve) throw new Error("Nothing to serve: no dev/start/preview script and no index.html.");
  const port = await freePort();
  const url = `http://127.0.0.1:${port}/`;
  const logs: string[] = [];
  let preview: Preview;

  const serveStatic = async (root: string, at: number, note?: string): Promise<Preview> => {
    const server = await staticServer(path.join(workspace, root), at);
    return {
      runId,
      port: at,
      url: `http://127.0.0.1:${at}/`,
      kind: "static",
      runner: "static",
      startedAt: Date.now(),
      logs,
      note,
      stop: async () => {
        await new Promise<void>((r) => server.close(() => r()));
        previews.delete(runId);
      },
    };
  };

  if (info.serve.kind === "static") {
    preview = await serveStatic(info.serve.root, port);
  } else {
    const controller = new AbortController();
    const host = runner === "docker" ? "0.0.0.0" : "127.0.0.1";
    const name = `arena-preview-${runId}`.toLowerCase().replace(/[^a-z0-9_.-]/g, "-");
    const proc = execIn(runner, {
      workspace,
      command: info.serve.command(port, host),
      env: { PORT: String(port), HOST: host, HOSTNAME: host, BROWSER: "none" },
      port,
      name,
      timeoutMs: 6 * 60 * 60_000,
      signal: controller.signal,
      onLine: (l) => {
        logs.push(l);
        if (logs.length > 400) logs.shift();
      },
    });
    preview = {
      runId,
      port,
      url,
      kind: "script",
      runner,
      startedAt: Date.now(),
      logs,
      stop: async () => {
        controller.abort();
        if (runner === "docker") await stopDocker(name);
        await proc.catch(() => undefined);
        previews.delete(runId);
      },
    };
    void proc.then(() => previews.delete(runId));
    // A plain static site may run a script on a fixed port that ignores PORT. If static
    // files exist, give the script less time and then serve them directly instead.
    const staticRoot = info.staticCandidates[0];
    const wait = staticRoot ? Math.min(opts.timeoutMs ?? 120_000, 30_000) : (opts.timeoutMs ?? 120_000);
    const up = await waitForHttp(url, wait);
    if (!up) {
      const tail = logs.slice(-15).join("\n");
      await preview.stop();
      if (staticRoot) {
        preview = await serveStatic(
          staticRoot,
          await freePort(),
          `Served ${staticRoot === "." ? "index.html" : `${staticRoot}/`} as static files: the ${info.serve.script} script did not answer on the PORT it was given within ${Math.round(wait / 1000)}s.`,
        );
      } else {
        throw new Error(`The app did not answer on ${url} within ${Math.round(wait / 1000)}s.\n${tail}`);
      }
    }
  }
  previews.set(runId, preview);
  setTimeout(() => {
    if (previews.get(runId) === preview) void preview.stop();
  }, IDLE_MS).unref();
  return preview;
}

export function getPreview(runId: string) {
  return previews.get(runId);
}

export async function stopPreview(runId: string) {
  await previews.get(runId)?.stop();
}

export async function stopAllPreviews() {
  await Promise.all([...previews.values()].map((p) => p.stop()));
}
