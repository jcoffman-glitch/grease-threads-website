import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasUsername: !!process.env.ADMIN_USERNAME,
    usernameValue: process.env.ADMIN_USERNAME,
    hasPassword: !!process.env.ADMIN_PASSWORD,
    passwordFirst5: (process.env.ADMIN_PASSWORD || "").substring(0, 5),
    passwordLength: (process.env.ADMIN_PASSWORD || "").length,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    nextauthUrl: process.env.NEXTAUTH_URL,
  });
}
