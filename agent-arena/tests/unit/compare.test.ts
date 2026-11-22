import { describe, expect, it } from "vitest";
import { compare } from "@/lib/evaluation/compare";

const runs = [
  { id: "a", label: "Alpha", values: { duration_ms: 1000, type_errors: 5, build_ok: 1 }, ratings: {} },
  { id: "b", label: "Beta", values: { duration_ms: 3000, type_errors: 0, build_ok: 1 }, ratings: {} },
  { id: "c", label: "Gamma", values: { duration_ms: 2000, build_ok: 0 }, ratings: {} },
];

describe("compare", () => {
  it("names leaders per criterion with direction respected", () => {
    const c = compare(runs, ["duration_ms", "type_errors"]);
    expect(c.leaders.find((l) => l.key === "duration_ms")?.leaders).toEqual(["Alpha"]);
    expect(c.leaders.find((l) => l.key === "type_errors")?.leaders).toEqual(["Beta"]);
  });

  it("reports trade-offs instead of a single winner", () => {
    const c = compare(runs, ["duration_ms", "type_errors"]);
    expect(c.tradeoffs.some((t) => t.includes("Alpha") && t.includes("Beta"))).toBe(true);
  });

  it("does not count missing measurements as losses and says they are missing", () => {
    const c = compare(runs, ["type_errors"]);
    expect(c.missing[0]).toContain("Gamma");
    const gamma = c.ranking.find((r) => r.id === "c")!;
    expect(gamma.averagePosition).toBeUndefined();
  });

  it("says nothing when everyone ties", () => {
    const c = compare(
      [
        { id: "a", label: "A", values: { build_ok: 1 }, ratings: {} },
        { id: "b", label: "B", values: { build_ok: 1 }, ratings: {} },
      ],
      ["build_ok"],
    );
    expect(c.leaders).toHaveLength(0);
  });

  it("ignores neutral metrics and includes manual ratings labelled as such", () => {
    const c = compare(
      [
        { id: "a", label: "A", values: { lines_added: 10 }, ratings: { typography: 4 } },
        { id: "b", label: "B", values: { lines_added: 500 }, ratings: { typography: 2 } },
      ],
      ["lines_added", "rating:typography"],
    );
    expect(c.leaders).toHaveLength(1);
    expect(c.leaders[0].source).toBe("manual");
    expect(c.leaders[0].label).toContain("your rating");
  });
});

describe("display precision", () => {
  it("does not call a 40 ms difference a lead", () => {
    const c = compare(
      [
        { id: "a", label: "A", values: { duration_ms: 1610 }, ratings: {} },
        { id: "b", label: "B", values: { duration_ms: 1650 }, ratings: {} },
      ],
      ["duration_ms"],
    );
    expect(c.leaders).toHaveLength(0);
    expect(c.tradeoffs).toHaveLength(0);
  });
});
