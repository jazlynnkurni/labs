"use client";

import { useMemo, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchOption = { value: string; label: string };

// Base UI treats an empty string as "no value", so the CLI default ("") travels under a sentinel.
const EMPTY = "__empty__";
const toInner = (v: string) => (v === "" ? EMPTY : v);
const toOuter = (v: string) => (v === EMPTY ? "" : v);

/**
 * A select with a search field, for long option lists. Same trigger as Select,
 * opens below it from its edge, filters by label or value as you type, and
 * keeps the chosen option checked. Arrows, Enter and Escape come from Base UI.
 */
export function SearchSelect({
  value,
  onValueChange,
  options,
  disabled,
  className,
  "aria-label": ariaLabel,
  searchLabel = "Search",
  emptyText = "No matches",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchOption[];
  disabled?: boolean;
  className?: string;
  "aria-label": string;
  searchLabel?: string;
  emptyText?: string;
}) {
  // Grey answers the pointer (CSS hover) or the keyboard, never the item Base UI
  // highlights by itself when the list opens on the chosen model.
  const [keyboard, setKeyboard] = useState(false);
  const items = useMemo(
    () =>
      Combobox.createItems(
        options.map((o) => ({ ...o, value: toInner(o.value) })),
        { getValue: (o) => o.value, getLabel: (o) => o.label },
      ),
    [options],
  );

  return (
    <Combobox.Root
      items={items}
      value={toInner(value)}
      onValueChange={(v) => v != null && onValueChange(toOuter(String(v)))}
      filter={(item, query) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return item.label.toLowerCase().includes(q) || toOuter(item.value).toLowerCase().includes(q);
      }}
      disabled={disabled}
      autoHighlight
      onOpenChange={() => setKeyboard(false)}
      onInputValueChange={(_, d) => d.reason === "input-change" && setKeyboard(true)}
      onItemHighlighted={(_, d) => d.reason !== "none" && setKeyboard(d.reason === "keyboard")}
    >
      <Combobox.Trigger
        aria-label={ariaLabel}
        className={cn(
          "flex h-7 w-fit min-w-0 items-center justify-between gap-1.5 rounded-[min(var(--radius-md),10px)] border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
          className,
        )}
      >
        <Combobox.Value>{(v: string) => <span className="min-w-0 flex-1 truncate text-left">{options.find((o) => o.value === toOuter(v))?.label ?? toOuter(v)}</span>}</Combobox.Value>
        <Combobox.Icon className="chev pointer-events-none text-muted-foreground [&>svg]:size-4">
          <ChevronDownIcon className="chev-down" />
          <ChevronUpIcon className="chev-up" />
        </Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner side="bottom" align="start" sideOffset={4} collisionAvoidance={{ side: "none", align: "shift" }} className="isolate z-50">
          <Combobox.Popup
            aria-label={ariaLabel}
            data-keyboard={keyboard ? "" : undefined}
            className="group/search flex max-h-[min(22rem,var(--available-height))] w-64 max-w-(--available-width) origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-ending-style:duration-100 data-starting-style:scale-[0.96] data-starting-style:opacity-0"
          >
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline px-2.5">
              <SearchIcon className="size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
              <Combobox.Input
                placeholder={searchLabel}
                aria-label={searchLabel}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint any-pointer-coarse:text-base"
              />
            </div>
            <Combobox.Empty>
              <p className="px-2.5 py-2 text-sm text-muted-foreground">{emptyText}</p>
            </Combobox.Empty>
            <Combobox.List className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 empty:hidden">
              {(o: SearchOption) => (
                <Combobox.Item
                  key={o.value}
                  value={o.value}
                  className="relative flex w-full cursor-default items-center rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none [@media(hover:hover)]:hover:bg-accent group-data-keyboard/search:data-highlighted:bg-accent"
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  <Combobox.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
