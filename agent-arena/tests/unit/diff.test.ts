import { describe, expect, it } from "vitest";
import { parseDiff } from "@/lib/client/diff";

const patch = `diff --git a/index.html b/index.html
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/index.html
@@ -0,0 +1,2 @@
+<h1>Hi</h1>
+<p>x</p>
diff --git a/a.ts b/a.ts
index 2222222..3333333 100644
--- a/a.ts
+++ b/a.ts
@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = 3;
 export { a, b };
`;

describe("parseDiff", () => {
  it("splits files, counts lines and numbers them", () => {
    const files = parseDiff(patch);
    expect(files.map((f) => [f.path, f.status, f.added, f.removed])).toEqual([
      ["index.html", "added", 2, 0],
      ["a.ts", "modified", 1, 1],
    ]);
    const changed = files[1].lines.filter((l) => l.kind !== "hunk");
    expect(changed[1]).toMatchObject({ kind: "del", oldNo: 2 });
    expect(changed[2]).toMatchObject({ kind: "add", newNo: 2 });
  });
});
