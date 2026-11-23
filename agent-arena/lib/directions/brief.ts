/**
 * Texts for "Continue directions": one kept run continued as several prototype
 * directions by the same agent. Every direction gets the same brief plus one
 * line naming its number; nothing else differs.
 */

export const DIRECTION_COUNT = 5;

export function continuationPrompt(original: string, fromLabel: string, note?: string) {
  const parts = [
    `Continue this project. It already holds a version that ${fromLabel} built for the task below. Build on it rather than starting over.`,
    `Original task:\n${original.trim()}`,
  ];
  if (note?.trim()) parts.push(`What to push on next:\n${note.trim()}`);
  return parts.join("\n\n");
}

export function directionLine(n: number, count: number) {
  return [
    `Direction ${n} of ${count}.`,
    `${count} copies of this brief run at the same time from the same starting files, each in its own workspace, and none can see the others.`,
    "Take a design direction of your own that is clearly different from simply polishing what is already here.",
    "Start your final message with one line that names your direction, then summarise what you built.",
  ].join(" ");
}

export function briefForDirection(brief: string, n: number | undefined, count: number | undefined) {
  if (!n || !count) return brief;
  return `${brief}\n\n${directionLine(n, count)}`;
}

/** The first line of a direction's final message, which the brief asks to be its name. */
export function directionName(summary: string | undefined) {
  const line = summary?.split("\n").map((l) => l.replace(/^[#*\s>-]+|[*\s]+$/g, "")).find(Boolean);
  if (!line) return undefined;
  return line.length > 90 ? `${line.slice(0, 89)}…` : line;
}
