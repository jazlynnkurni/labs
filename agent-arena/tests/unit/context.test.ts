import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { composeContext, listSources } from "@/lib/context/design-context";
import { startExperiment } from "@/lib/orchestration/runner";
import { experiments, runs } from "@/lib/storage/repo";

beforeAll(() => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "arena-claude-home-"));
  fs.writeFileSync(
    path.join(home, "CLAUDE.md"),
    [
      "# Someone",
      "## Standing rules (binding)",
      "1. No em dashes anywhere.",
      "2. Unrelated rule.",
      "8. Do not add things she did not ask for.",
      "## Design defaults",
      "- 8pt grid.",
      "- Tokens come from the Autumn scale.",
      "Brand palettes stay as set: Clover green.",
      "## Project map",
      "- secret project list",
    ].join("\n"),
  );
  const skill = path.join(home, "skills", "sticky-pill");
  fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(skill, "SKILL.md"), "---\nname: sticky-pill\ndescription: Text in a pill never moves. More detail.\n---\n# sticky-pill\nLabels never move.\nSee autumn-system/styles.css for where it lives.\n");
  process.env.ARENA_CLAUDE_HOME = home;
});

describe("design context", () => {
  it("lists sources with sizes and counts removed company lines", () => {
    const s = listSources();
    expect(s.map((x) => x.id)).toEqual(["defaults", "skill:sticky-pill"]);
    expect(s.find((x) => x.id === "defaults")?.removedLines).toBe(1);
    expect(s.find((x) => x.id === "skill:sticky-pill")?.description).toBe("Text in a pill never moves.");
  });

  it("composes only the chosen rules and never company lines or other sections", () => {
    const c = composeContext(["defaults", "skill:sticky-pill"])!;
    expect(c.text).toContain("8pt grid");
    expect(c.text).toContain("No em dashes");
    expect(c.text).toContain("Labels never move.");
    expect(c.text).not.toMatch(/autumn|clover/i);
    expect(c.text).not.toContain("Unrelated rule");
    expect(c.text).not.toContain("secret project list");
    expect(c.removedLines).toBe(2);
    expect(composeContext(["nope"])).toBeUndefined();
  });

  it("gives every agent the identical file and records it", async () => {
    const id = await startExperiment({
      prompt: "Build a page",
      config: {
        agents: [
          { agentId: "dev-fixture", model: "variant-a" },
          { agentId: "dev-fixture", model: "variant-b" },
        ],
        parallel: true,
        limits: { timeoutMinutes: 1 },
        evaluation: { enabled: false, runner: "off" },
        constraints: "",
        context: { ids: ["defaults", "skill:sticky-pill"] },
      },
      source: { kind: "empty" },
      files: [],
    });
    let exp = await experiments.get(id);
    for (let i = 0; i < 100 && exp && !["done", "failed"].includes(exp.status); i++) {
      await new Promise((r) => setTimeout(r, 200));
      exp = await experiments.get(id);
    }
    expect(exp!.status).toBe("done");
    expect(exp!.brief).toContain("read .arena/attachments/DESIGN-CONTEXT.md");
    expect(exp!.config.context?.hash).toMatch(/^[0-9a-f]{16}$/);
    expect(exp!.differences.join(" ")).toContain("same design context");
    const files = (await runs.forExperiment(id)).map((r) => fs.readFileSync(path.join(r.workspaceDir!, ".arena/attachments/DESIGN-CONTEXT.md"), "utf8"));
    expect(files[0]).toBe(files[1]);
    expect(files[0]).toContain("Labels never move.");
  });
});
