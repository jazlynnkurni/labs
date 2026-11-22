import { listSources } from "@/lib/context/design-context";
import { handler, json } from "@/lib/server/api";

/** Design context sources available on this Mac, with sizes. No file contents. */
export const GET = handler(async () => json({ sources: listSources() }));
