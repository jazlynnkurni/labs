import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Disclosure arrow: down at rest, up while open, as an icon swap (never a rotation).
 * Open comes from `open`, from a `[data-popup-open]` ancestor, or from an open
 * `<details>` around the summary it sits in. The motion lives in globals.css (.chev).
 */
export function SwapChevron({ open, className }: { open?: boolean; className?: string }) {
  return (
    <span className={cn("chev text-current [&>svg]:size-3.5", className)} data-open={open ? "true" : undefined} aria-hidden>
      <ChevronDown className="chev-down" strokeWidth={1.75} />
      <ChevronUp className="chev-up" strokeWidth={1.75} />
    </span>
  );
}
