import { NextRequest, NextResponse } from "next/server";
import { dbCreateJob } from "@/lib/db";
import type { Job } from "@/lib/types";

// Simple in-memory rate limiter: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

async function notifyNewLead(job: Job) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "🔔 New Lead",
        color: 0xF59E0B,
        fields: [
          { name: "Customer", value: job.customerName || "Unknown", inline: true },
          { name: "Phone", value: job.customerPhone || "None", inline: true },
          { name: "Service", value: job.serviceType || "Unknown", inline: true },
          { name: "Problem", value: job.problemDescription || "No description" },
        ],
        timestamp: new Date().toISOString(),
      }]
    }),
  }).catch(() => {}); // fire and forget
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
    }

    const body = await request.json();
    const { name, phone, email, serviceType, message } = body;

    if (!name || !phone || !serviceType || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create lead in DB
    const job = await dbCreateJob({
      customerName: name,
      customerPhone: phone,
      customerEmail: email || undefined,
      serviceType: serviceType,
      problemDescription: message,
      status: "Lead",
    });

    // Fire Discord notification
    await notifyNewLead(job);

    return NextResponse.json({ success: true, message: "Message received" });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
