import { connection } from "next/server";

/** Wrap a route handler: always request-time, JSON errors, no stack traces to the client. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    await connection();
    try {
      return await fn(...args);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      return Response.json({ error: message }, { status: 400 });
    }
  };
}

export const json = (data: unknown, init?: ResponseInit) => Response.json(data, init);
