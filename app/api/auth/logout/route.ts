import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
