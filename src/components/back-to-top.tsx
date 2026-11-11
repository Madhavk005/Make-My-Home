"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-20 right-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink shadow-lg transition-colors hover:border-primary hover:text-primary-deep md:bottom-6"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
