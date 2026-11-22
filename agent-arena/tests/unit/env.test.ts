import { describe, expect, it } from "vitest";
import { buildChildEnv, redact } from "@/lib/sandbox/env";
import { composeBrief, hashConfig } from "@/lib/orchestration/brief";

describe("child env", () => {
  it("passes only allowlisted variables", () => {
    process.env.SOME_PRIVATE_TOKEN = "should-not-leak-123";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-1234567890";
    const env = buildChildEnv({ allow: ["OPENAI_API_KEY"] });
    expect(env.SOME_PRIVATE_TOKEN).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.PATH).toBeTruthy();
  });

  it("redacts secret values and token shapes", () => {
    process.env.MY_SECRET_KEY = "supersecretvalue99";
    expect(redact("key=supersecretvalue99")).toBe("key=[redacted]");
    expect(redact("auth sk-ant-abcdefghijklmnop")).toBe("auth [redacted]");
    expect(redact("Authorization: Bearer abcdefghijklmnopqrstu")).toContain("[redacted]");
  });
});

describe("brief", () => {
  it("is identical for identical input and lists attachments", () => {
    const a = composeBrief("Build X", "Rules", [".arena/attachments/a.png"]);
    const b = composeBrief("Build X", "Rules", [".arena/attachments/a.png"]);
    expect(a).toBe(b);
    expect(a).toContain(".arena/attachments/a.png");
  });
  it("hash changes when the brief changes", () => {
    const cfg = { agents: [], parallel: true, limits: { timeoutMinutes: 5 }, evaluation: { enabled: false, runner: "off" as const }, constraints: "" };
    expect(hashConfig("a", cfg, "c1")).not.toBe(hashConfig("b", cfg, "c1"));
  });
});
