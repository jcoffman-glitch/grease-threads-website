import { NextRequest, NextResponse } from "next/server";
import { dbCreateJob } from "@/lib/db";
import type { Job } from "@/lib/types";

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
