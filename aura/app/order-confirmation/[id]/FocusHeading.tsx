"use client";

import { useEffect, useRef } from "react";

// Epic 10, Story 10.11 (UI/UX spec): move focus to the page heading on load so screen-reader and
// keyboard users land on the confirmation, not on the header they navigated from.
export function FocusHeading({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className="font-serif text-3xl text-ink outline-none">
      {children}
    </h1>
  );
}
