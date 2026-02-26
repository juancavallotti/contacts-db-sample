"use client";

import Link from "next/link";

/**
 * Floating CTA in bottom-left: "Want to work with me? Call my agent" → opens juancavallotti.com/ai-assistant.
 */
export function AgentCtaFloat() {
  return (
    <Link
      href="https://juancavallotti.com/ai-assistant"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
      title="Want to work with me? Call my agent"
      aria-label="Want to work with me? Call my agent"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/25 text-base font-bold">
        ?
      </span>
      <span className="hidden sm:inline">Questions? Call my agent</span>
    </Link>
  );
}
