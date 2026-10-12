"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Goes back in history; falls back to "/" when there is no in-app history (e.g. a deep link).
export function BackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-6 flex min-h-11 items-center gap-1 text-sm text-ink-soft hover:text-ink"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );
}
