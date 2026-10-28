import type { ReactNode } from "react";

/**
 * Wide tables scroll inside this region on small screens. The region is focusable and labelled so
 * keyboard users can scroll it too (axe rule scrollable-region-focusable, WCAG 2.1.1). Biome's
 * noNoninteractiveTabindex is turned off for this file only, in biome.json, with the owner's approval
 * of 2026-10-28; nowhere else may a non-interactive element take tabIndex.
 */
export function TableWrap({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="table-wrap" tabIndex={0} aria-label={label}>
      {children}
    </section>
  );
}
