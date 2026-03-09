import { jwtVerify, SignJWT } from "jose";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
};

export interface AccessTokenPayload {
  email: string;
  roles: string[];
}

export interface RefreshTokenPayload {
  email: string;
}

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(getSecret());
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== "access") return null;
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== "refresh") return null;
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}
