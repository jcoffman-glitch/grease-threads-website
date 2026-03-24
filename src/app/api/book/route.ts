import { NextRequest, NextResponse } from "next/server";
import { dbCreateJob } from "@/lib/db";
import type { Job } from "@/lib/types";

async function notifyNewBooking(job: Job) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "📋 New Service Request",
        color: 0xF59E0B,
        fields: [
          { name: "Customer", value: job.customerName || "Unknown", inline: true },
          { name: "Phone", value: job.customerPhone || "None", inline: true },
          { name: "Service", value: job.serviceType || "Unknown", inline: true },
          { name: "Address", value: job.address || "Not provided", inline: true },
          { name: "Problem", value: job.problemDescription || "No description" },
          { name: "Tracking Token", value: `\`${job.trackingToken}\`` },
        ],
        timestamp: new Date().toISOString(),
      }]
    }),
  }).catch(() => {});
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceType,
      problemDescription,
      address,
      firstName,
      lastName,
      phone,
      email,
      preferredTiming,
    } = body;

    if (!serviceType || !phone || !firstName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const customerName = `${firstName} ${lastName || ""}`.trim();

    // Build notes with timing preference
    const notes = preferredTiming ? `Preferred timing: ${preferredTiming}` : undefined;

    const job = await dbCreateJob({
      customerName,
      customerPhone: phone,
      customerEmail: email || undefined,
      serviceType,
      problemDescription,
      address,
      status: "Lead",
      notes,
      leadSource: "website-booking",
    });

    await notifyNewBooking(job);

    return NextResponse.json({
      success: true,
      token: job.trackingToken,
      jobId: job.id,
    });
  } catch (err) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
