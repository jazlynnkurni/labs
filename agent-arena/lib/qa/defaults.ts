import { composeContext } from "@/lib/context/design-context";

/** A starting brief for the Button proof of concept. Edit it on the dashboard; it is saved with each run. */
export const DEFAULT_BRIEF =
  "Buttons in Agent Arena are one quiet, consistent family. The primary is the one filled action in a group; secondary, outline and ghost step down. A press darkens and nothing moves. Labels are short sentence-case verbs that say what happens. A destructive action reads as irreversible by more than colour alone.";

/** Her design defaults plus the rule skills that govern buttons, company lines stripped. */
export function defaultRules() {
  return composeContext(["defaults", "skill:sticky-pill", "skill:press-answers", "skill:break-never"])?.text ?? "";
}
