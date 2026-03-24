import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(request: Request) {
  const denied = await auth();
  if (denied) return denied;

  const { description, equipmentType, modelNumber } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      suggestions: `Based on the reported issue: "${description || "No description"}"

Common causes to check:
- Verify power supply and electrical connections
- Check for obvious mechanical failures or wear
- Inspect filters, coils, or moving parts for blockages
- Test thermostat/control board functionality

Note: AI suggestions require ANTHROPIC_API_KEY to be configured for detailed diagnostics.`,
    });
  }

  try {
    const prompt = `You are a field service technician assistant for an HVAC and appliance repair company. Based on the following work order, provide brief diagnostic suggestions.

Equipment Type: ${equipmentType || "Unknown"}
${modelNumber ? `Model: ${modelNumber}` : ""}
Issue: ${description || "No description provided"}

Provide:
1. Most likely causes (3-5 bullet points)
2. Parts to check first
3. Estimated complexity (Simple/Moderate/Complex)

Keep it concise and practical for a tech in the field.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("AI suggest API error:", err);
      return Response.json({ suggestions: "AI service temporarily unavailable. Please try again." });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "No suggestions generated.";
    return Response.json({ suggestions: text });
  } catch (e) {
    console.error("AI suggest error:", e);
    return Response.json({ suggestions: "Failed to generate suggestions. Please try again." });
  }
}
