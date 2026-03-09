import { NextResponse } from "next/server";
import { lookupByEmailAndToken } from "@/lib/auth/access-list";
import {
  ACCESS_COOKIE,
  cookieOptions,
  REFRESH_COOKIE,
} from "@/lib/auth/constants";
import { signAccessToken, signRefreshToken } from "@/lib/auth/tokens";

const MIN_DELAY_MS = 800;

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.PRIVATE_ACCESS_ENABLED !== "true") {
    return NextResponse.json({ error: "Désactivé" }, { status: 404 });
  }

  const body = (await request.json()) as { email?: string; token?: string };
  const email = body.email?.trim().toLowerCase();
  const token = body.token?.trim();

  if (!email || !token) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  // Délai minimum constant — succès et échec ont la même durée (anti-timing)
  const [entry] = await Promise.all([
    lookupByEmailAndToken(email, token),
    new Promise((r) => setTimeout(r, MIN_DELAY_MS)),
  ]);

  if (!entry) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ email: entry.email, roles: entry.roles }),
    signRefreshToken({ email: entry.email }),
  ]);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions.access);
  response.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions.refresh);
  return response;
}
