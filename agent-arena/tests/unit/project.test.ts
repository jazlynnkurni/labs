import { describe, expect, it } from "vitest";
import { countTsErrors, parseTestCounts } from "@/lib/evaluation/project";

describe("parseTestCounts", () => {
  it("reads vitest", () => expect(parseTestCounts(" Tests  2 failed | 10 passed (12)")).toEqual({ failed: 2, passed: 10 }));
  it("reads vitest all passing", () => expect(parseTestCounts(" Tests  7 passed (7)")).toEqual({ failed: 0, passed: 7 }));
  it("reads jest", () => expect(parseTestCounts("Tests:       1 failed, 3 passed, 4 total")).toEqual({ failed: 1, passed: 3 }));
  it("reads node:test TAP", () => expect(parseTestCounts("# tests 3\n# pass 2\n# fail 1\n")).toEqual({ passed: 2, failed: 1 }));
  it("reads node:test spec", () => expect(parseTestCounts("ℹ tests 2\nℹ pass 2\nℹ fail 0")).toEqual({ passed: 2, failed: 0 }));
  it("returns undefined when it cannot tell", () => expect(parseTestCounts("all good")).toBeUndefined());
});

describe("countTsErrors", () => {
  it("counts each TS error", () => expect(countTsErrors("a.ts(1,1): error TS2304: x\nb.ts(2,2): error TS2322: y")).toBe(2));
});
