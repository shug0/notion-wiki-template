import { type NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  cookieOptions,
  isPrivateAccessEnabled,
  REFRESH_COOKIE,
} from "@/lib/auth/constants";
import {
  signAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/tokens";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (!isPrivateAccessEnabled()) {
    return NextResponse.next();
  }

  const accessCookie = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;

  // Access token valid → inject user headers for RSC
  if (accessCookie) {
    const payload = await verifyAccessToken(accessCookie);
    if (payload) {
      return injectUserHeaders(request, payload.email, payload.roles);
    }
  }

  // Access token expired → try refresh via Notion
  if (refreshCookie) {
    const refreshPayload = await verifyRefreshToken(refreshCookie);
    if (refreshPayload) {
      const entry = await refreshFromNotion(refreshPayload.email);
      if (entry) {
        const newAccessToken = await signAccessToken(entry);
        const res = injectUserHeaders(request, entry.email, entry.roles);
        res.cookies.set(ACCESS_COOKIE, newAccessToken, cookieOptions.access);
        return res;
      }
    }
  }

  // No valid session — pass through (RSC handles private page check)
  return NextResponse.next();
}

function injectUserHeaders(
  request: NextRequest,
  email: string,
  roles: string[],
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-email", email);
  requestHeaders.set("x-user-roles", JSON.stringify(roles));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function refreshFromNotion(
  email: string,
): Promise<{ email: string; roles: string[] } | null> {
  const dbId = process.env.NOTION_ACCESS_LIST_DB_ID;
  const notionToken = process.env.NOTION_TOKEN;
  if (!dbId || !notionToken) return null;

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { property: "email", title: { equals: email } },
          page_size: 1,
        }),
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: {
        properties?: { roles?: { relation?: { id: string }[] } };
      }[];
    };
    const result = data.results?.[0];
    if (!result) return null;

    const roles =
      result.properties?.roles?.relation?.map((r) => r.id.replace(/-/g, "")) ??
      [];
    return { email, roles };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
