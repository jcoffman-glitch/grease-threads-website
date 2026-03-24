import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbUpdateJob, dbGetJob } from "@/lib/db";

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

const MOCK_SUGGESTIONS: Record<string, string[]> = {
  HVAC: [
    "Check thermostat settings and batteries",
    "Inspect air filter — replace if dirty",
    "Verify refrigerant levels",
    "Check capacitor and contactor",
    "Inspect blower motor and belt",
  ],
  Appliance: [
    "Check power supply and outlet voltage",
    "Inspect door seal/gasket for damage",
    "Test control board for error codes",
    "Check water supply lines if applicable",
    "Inspect motor and drive belt",
  ],
  "Commercial Kitchen": [
    "Check gas supply and pilot light",
    "Inspect burner assemblies for clogs",
    "Test thermostat calibration",
    "Check ventilation hood and filters",
    "Inspect electrical connections",
  ],
  Handyman: [
    "Assess scope of repair needed",
    "Check for underlying structural issues",
    "Verify materials needed for the job",
    "Test existing fixtures before replacement",
    "Document current condition with photos",
  ],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth();
  if (denied) return denied;
  const { id } = await params;

  const { description, equipmentType, modelNumber } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const suggestions = MOCK_SUGGESTIONS[equipmentType] || MOCK_SUGGESTIONS["HVAC"];
    // Cache in DB
    const job = await dbGetJob(id);
    if (job) {
      await dbUpdateJob(id, { aiSuggestions: suggestions.join("\n") });
    }
    return Response.json({ suggestions });
  }

  try {
    const prompt = `You are a field service technician assistant for an HVAC and appliance repair company. Based on the following work order, provide brief diagnostic suggestions.

Equipment Type: ${equipmentType || "Unknown"}
${modelNumber ? `Model: ${modelNumber}` : ""}
Issue: ${description || "No description provided"}

Provide 3-5 concise bullet points of the most likely causes and things to check first. Keep it practical for a tech in the field. Return ONLY the bullet points, one per line, starting with a dash.`;

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
      console.error("AI suggest API error:", await res.text());
      return Response.json({ suggestions: ["AI service temporarily unavailable. Please try again."] });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const suggestions = text.split("\n").filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-•*]\s*/, "").trim());

    // Cache in DB
    const job = await dbGetJob(id);
    if (job) {
      await dbUpdateJob(id, { aiSuggestions: suggestions.join("\n") });
    }

    return Response.json({ suggestions });
  } catch (e) {
    console.error("AI suggest error:", e);
    return Response.json({ suggestions: ["Failed to generate suggestions. Please try again."] });
  }
}
