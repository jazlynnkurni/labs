import { claudeCode } from "./claude-code";
import { codex } from "./codex";
import { cursor } from "./cursor";
import { blackbox } from "./blackbox";
import { devin } from "./devin";
import { devFixture } from "./dev-fixture";
import type { AgentAdapter, AgentId } from "./types";

/** To add an agent: write an adapter that implements AgentAdapter and list it here. */
const ADAPTERS: AgentAdapter[] = [claudeCode, codex, cursor, blackbox, devin, devFixture];

export const devFixturesEnabled = () => process.env.ARENA_DEV_FIXTURES === "1";

export function listAdapters(): AgentAdapter[] {
  return ADAPTERS.filter((a) => !a.devOnly || devFixturesEnabled());
}

export function getAdapter(id: AgentId | string): AgentAdapter | undefined {
  return ADAPTERS.find((a) => a.id === id && (!a.devOnly || devFixturesEnabled()));
}
