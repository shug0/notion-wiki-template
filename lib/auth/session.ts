import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import type { SessionUser } from "./session-cache";

/**
 * Read session injected by middleware via x-user-* headers.
 * Memoized per request via React cache() — safe to call multiple times.
 * Server-only — use session-cache.ts for block-level access.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  if (process.env.PRIVATE_ACCESS_ENABLED !== "true") return null;

  const h = await headers();
  const email = h.get("x-user-email");
  const rolesRaw = h.get("x-user-roles");

  if (!email || !rolesRaw) return null;

  try {
    const roles = JSON.parse(rolesRaw) as string[];
    return { email, roles };
  } catch {
    return null;
  }
});
