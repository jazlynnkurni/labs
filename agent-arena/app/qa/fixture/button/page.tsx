import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * QA fixture: the real Button in every variant and size, for the design QA extractor.
 * Items sit 48px apart so a 40px hit probe never lands on a neighbour.
 */
const ITEMS = [
  { id: "default", variant: "default", size: "default", label: "Run comparison" },
  { id: "secondary", variant: "secondary", size: "default", label: "Save draft" },
  { id: "outline", variant: "outline", size: "default", label: "Import result" },
  { id: "ghost", variant: "ghost", size: "default", label: "Show details" },
  { id: "destructive", variant: "destructive", size: "default", label: "Delete experiment" },
  { id: "link", variant: "link", size: "default", label: "Open report" },
  { id: "default-xs", variant: "default", size: "xs", label: "Run comparison" },
  { id: "default-sm", variant: "default", size: "sm", label: "Run comparison" },
  { id: "default-lg", variant: "default", size: "lg", label: "Run comparison" },
] as const;

export default function ButtonFixture() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-16">
      <h1 className="text-xl font-semibold tracking-tight">Button fixture</h1>
      <p className="mt-1 text-sm text-muted-foreground">The real component in every variant and size, measured by design QA.</p>
      <div data-qa-root className="mt-8 flex flex-wrap items-center gap-12 rounded-xl p-8">
        {ITEMS.map((it) => (
          <Button key={it.id} data-qa-id={it.id} data-variant={it.variant} data-size={it.size} variant={it.variant} size={it.size}>
            {it.label}
          </Button>
        ))}
        <Button data-qa-id="icon-default" data-variant="default" data-size="icon" size="icon" aria-label="New comparison">
          <Plus />
        </Button>
        <Button data-qa-id="icon-ghost" data-variant="ghost" data-size="icon" variant="ghost" size="icon" aria-label="Refresh agents">
          <RefreshCw />
        </Button>
      </div>
    </div>
  );
}
