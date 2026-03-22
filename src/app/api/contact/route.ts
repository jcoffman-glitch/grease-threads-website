import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, phone, email, serviceType, message } = body;

    if (!name || !phone || !serviceType || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the submission (will wire up email later)
    console.log("Contact form submission:", {
      name,
      phone,
      email,
      serviceType,
      message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Message received" });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
