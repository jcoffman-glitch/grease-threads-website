import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "it") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA
    ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    : "local";

  return Response.json({
    testBypass: process.env.TEST_AUTH_BYPASS === "true",
    resendKey: !!process.env.RESEND_API_KEY,
    anthropicKey: !!process.env.ANTHROPIC_API_KEY,
    commitSha,
  });
}
