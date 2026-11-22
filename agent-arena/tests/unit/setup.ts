import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Never touch the real ~/.agent-arena from tests.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arena-test-"));
process.env.ARENA_DATA_DIR = dir;
process.env.ARENA_DEV_FIXTURES = "1";
