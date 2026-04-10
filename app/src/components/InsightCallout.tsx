import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

export function InsightCallout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-600" />
      <p className="text-sm leading-relaxed text-gray-900">{children}</p>
    </div>
  );
}
