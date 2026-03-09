// Safe in all contexts (Edge, Node, client)

export const ACCESS_COOKIE = "wiki_access";
export const REFRESH_COOKIE = "wiki_refresh";

/** Toggle markers — used in Notion block titles */
export const PRIVATE_TOGGLE = "🔒"; // private content, hidden to non-authenticated
export const PUBLIC_TOGGLE = "🔏"; // public fallback, hidden to authenticated

export const cookieOptions = {
  access: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  },
  refresh: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30d
    path: "/",
  },
};

export function isPrivateAccessEnabled(): boolean {
  return process.env.PRIVATE_ACCESS_ENABLED === "true";
}
