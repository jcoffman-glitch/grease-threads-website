import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@libsql/client/http";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

async function authCheck(request: Request): Promise<boolean> {
  // Vercel native cron sends this header automatically
  if (request.headers.get("x-vercel-cron") === "1") return true;

  // Manual trigger with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }

  // Fallback: admin session
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function POST(request: Request) {
  const allowed = await authCheck(request);
  if (!allowed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const fbToken = process.env.GNT_FB_PAGE_TOKEN;
  const FB_PAGE_ID = "724231654113583";

  const due = await db.execute(
    `SELECT * FROM social_posts WHERE status='Approved' AND scheduled_at <= datetime('now')`
  );

  let published = 0;
  const errors: unknown[] = [];

  for (const post of due.rows) {
    try {
      const content = post.generated_content as string;
      if (!content) {
        errors.push({ id: post.id, error: "No generated content" });
        continue;
      }

      const fbRes = await fetch(`https://graph.facebook.com/v22.0/${FB_PAGE_ID}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          access_token: fbToken,
        }),
      });

      const fbData = await fbRes.json() as { id?: string; error?: { message: string } };

      if (!fbRes.ok || fbData.error) {
        throw new Error(fbData.error?.message || "Facebook API error");
      }

      const fbPostId = fbData.id!;
      const fbPostUrl = `https://www.facebook.com/${fbPostId.replace("_", "/posts/")}`;

      await db.execute({
        sql: `UPDATE social_posts SET status='Posted', posted_at=datetime('now'), fb_post_id=?, fb_post_url=?, updated_at=datetime('now') WHERE id=?`,
        args: [fbPostId, fbPostUrl, post.id as string],
      });

      published++;
    } catch (err: unknown) {
      errors.push({ id: post.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({ published, errors });
}
