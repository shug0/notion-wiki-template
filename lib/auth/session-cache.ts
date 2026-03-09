import { cache } from "react";

export interface SessionUser {
  email: string;
  roles: string[];
}

/**
 * Per-request mutable session store using React cache().
 * Seeded by page.tsx/layout.tsx (RSC) before rendering.
 * Read by callout.block.tsx without needing next/headers.
 */
export const getSessionStore = cache(
  (): { user: SessionUser | null } => ({ user: null }),
);
