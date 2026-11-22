import { z } from "zod";
import { composeContext } from "@/lib/context/design-context";
import { handler, json } from "@/lib/server/api";

const body = z.object({ ids: z.array(z.string().max(80)).max(40) });

/** Exactly what every agent would receive for these sources. */
export const POST = handler(async (req: Request) => {
  const { ids } = body.parse(await req.json());
  const c = composeContext(ids);
  return json(c ?? { text: "", bytes: 0, hash: "", ids: [], removedLines: 0 });
});
