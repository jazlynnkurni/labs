import { Fragment, type ReactNode } from "react";

/**
 * A small, safe Markdown subset for agent summaries: paragraphs, bold, italic,
 * inline code, fenced code blocks, bullet and numbered lists, and links.
 * Everything becomes React elements, so raw HTML in the text is shown as text,
 * never rendered. Headings are shown as bold lines so they do not break the
 * page's heading order. Links only open http(s) and mailto, in a new tab.
 */

type Block =
  | { kind: "p"; text: string; strong?: boolean }
  | { kind: "code"; text: string }
  | { kind: "ul" | "ol"; items: string[]; start?: number };

const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBER = /^\s*(\d+)[.)]\s+(.*)$/;
const FENCE = /^\s*(```|~~~)/;
const HEADING = /^\s*#{1,6}\s+(.*?)\s*#*\s*$/;

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(FENCE);
    if (fence) {
      flush();
      const body: string[] = [];
      for (i++; i < lines.length && !lines[i].trimStart().startsWith(fence[1]); i++) body.push(lines[i]);
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      flush();
      blocks.push({ kind: "p", text: heading[1], strong: true });
      continue;
    }
    const bullet = line.match(BULLET);
    const number = bullet ? null : line.match(NUMBER);
    if (bullet || number) {
      flush();
      const kind = bullet ? "ul" : "ol";
      const last = blocks[blocks.length - 1];
      const text = bullet ? bullet[1] : number![2];
      if (last && last.kind === kind) last.items.push(text);
      else blocks.push(kind === "ol" ? { kind, items: [text], start: Number(number![1]) } : { kind, items: [text] });
      continue;
    }
    // An indented line right after a list item continues that item.
    const last = blocks[blocks.length - 1];
    if (!para.length && /^\s{2,}\S/.test(line) && last && (last.kind === "ul" || last.kind === "ol")) {
      last.items[last.items.length - 1] += " " + line.trim();
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return blocks;
}

const INLINE =
  /(`+)([\s\S]+?)\1|\*\*(.+?)\*\*|__(.+?)__|\*(?![\s*])(.+?)\*|(?<![\w])_(?![\s_])(.+?)_(?![\w])|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])/;

function safeHref(url: string) {
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : undefined;
}

function Anchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-info [@media(hover:hover)]:hover:text-foreground">
      {children}
    </a>
  );
}

function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let n = 0;
  while (rest) {
    const m = rest.match(INLINE);
    if (!m || m.index === undefined) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const k = `${key}-${n++}`;
    if (m[2] !== undefined) {
      out.push(
        <code key={k} className="rounded bg-surface-2 px-1 py-px font-mono text-[12px]">
          {m[2].trim()}
        </code>,
      );
    } else if (m[3] !== undefined || m[4] !== undefined) {
      out.push(
        <strong key={k} className="font-semibold">
          {inline(m[3] ?? m[4], k)}
        </strong>,
      );
    } else if (m[5] !== undefined || m[6] !== undefined) {
      out.push(<em key={k}>{inline(m[5] ?? m[6], k)}</em>);
    } else if (m[7] !== undefined) {
      // Local file paths and other schemes keep their text but are not links.
      const href = safeHref(m[8].replace(/^<|>$/g, ""));
      out.push(href ? <Anchor key={k} href={href}>{inline(m[7], k)}</Anchor> : <Fragment key={k}>{inline(m[7], k)}</Fragment>);
    } else if (m[9] !== undefined) {
      out.push(
        <Anchor key={k} href={m[9]}>
          {m[9]}
        </Anchor>,
      );
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.kind === "code") {
          return (
            <pre key={i} className="scrollbar-thin overflow-x-auto overscroll-x-none rounded-lg bg-surface-2/50 p-3 font-mono text-[12px] leading-5 ring-1 ring-hairline">
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.kind === "ul" || b.kind === "ol") {
          const List = b.kind;
          return (
            <List key={i} start={b.start} className={`flex flex-col gap-1 pl-4 marker:text-faint ${b.kind === "ul" ? "list-disc" : "list-decimal"}`}>
              {b.items.map((item, j) => (
                <li key={j} className="pl-0.5">
                  {inline(item, `${i}-${j}`)}
                </li>
              ))}
            </List>
          );
        }
        if (b.kind !== "p") return null;
        return (
          <p key={i} className={b.strong ? "font-semibold" : undefined}>
            {inline(b.text, String(i))}
          </p>
        );
      })}
    </div>
  );
}
