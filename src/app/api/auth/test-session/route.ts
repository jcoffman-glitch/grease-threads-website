import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  if (process.env.TEST_AUTH_BYPASS !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role, email } = await req.json();

  if (!role || !email) {
    return NextResponse.json(
      { error: "role and email are required" },
      { status: 400 }
    );
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET not configured" },
      { status: 500 }
    );
  }

  const now = Math.floor(Date.now() / 1000);

  // Use NextAuth's own encode() so the token is a proper JWE that NextAuth can decrypt.
  // Plain SignJWT (JWS) won't work — NextAuth v4 uses encrypted tokens by default.
  const token = await encode({
    secret,
    token: {
      name: `Test ${role}`,
      email,
      role,
      provider: "test",
      sub: email,
      iat: now,
      exp: now + 60 * 60 * 24,
      jti: randomUUID(),
    },
    maxAge: 60 * 60 * 24,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("next-auth.session-token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
