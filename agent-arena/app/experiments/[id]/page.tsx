import { Suspense } from "react";
import { ExperimentView } from "@/components/experiment/experiment-view";

export default function ExperimentPage() {
  return (
    <Suspense>
      <ExperimentView />
    </Suspense>
  );
}
