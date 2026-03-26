/**
 * Google Calendar sync service for Grease & Threads.
 * Fetches events from the GnT Google Calendar and auto-creates jobs
 * in Turso for Google Appointment bookings not already in the system.
 *
 * One-way sync: Calendar → Command Center
 */

import { google } from "googleapis";
import { dbCreateJob, dbGetJobByCalendarEventId, dbSetJobCalendarEventId } from "./db";

// ── Type for parsed event description ────────────────────────────────────────

export interface ParsedEventDescription {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  problemDescription?: string;
  address?: string;
}

// ── HTML → plain text (minimal, no external dep) ─────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

// ── Event description parser ──────────────────────────────────────────────────

export function parseEventDescription(htmlDescription: string): ParsedEventDescription {
  const text = htmlToText(htmlDescription);
  const lines = text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let customerName: string | undefined;
  let customerEmail: string | undefined;
  let customerPhone: string | undefined;
  let problemDescription: string | undefined;
  let address: string | undefined;

  // Find "Booked by:" line — name follows after it
  const bookedByIdx = lines.findIndex((l) =>
    l.toLowerCase().startsWith("booked by:")
  );

  if (bookedByIdx !== -1) {
    // Name is either inline ("Booked by: John Smith") or on the next line
    const bookedByLine = lines[bookedByIdx];
    const inlineName = bookedByLine.replace(/^booked by:\s*/i, "").trim();

    if (inlineName) {
      customerName = inlineName;
      // email is next line, phone is line after that
      customerEmail = lines[bookedByIdx + 1];
      customerPhone = lines[bookedByIdx + 2];
    } else {
      // Name on next line
      customerName = lines[bookedByIdx + 1];
      customerEmail = lines[bookedByIdx + 2];
      customerPhone = lines[bookedByIdx + 3];
    }
  }

  // Validate email — must contain @
  if (customerEmail && !customerEmail.includes("@")) {
    // Might be a phone, not an email — swap
    customerPhone = customerEmail;
    customerEmail = undefined;
  }

  // Validate phone — must contain at least 7 digits
  if (customerPhone && !/\d{7}/.test(customerPhone.replace(/\D/g, ""))) {
    customerPhone = undefined;
  }

  // Extract problem description
  const problemMatch = text.match(/PROBLEM DESCRI[A-Z]*:\s*(.+?)(?=\n|Address City State:|$)/i);
  if (problemMatch) {
    problemDescription = problemMatch[1].trim();
  }

  // Extract address
  const addressMatch = text.match(/Address City State:\s*(.+?)(?:\n|$)/i);
  if (addressMatch) {
    address = addressMatch[1].trim();
  }

  return { customerName, customerEmail, customerPhone, problemDescription, address };
}

// ── Extract customer name from event summary ──────────────────────────────────

function extractNameFromSummary(summary: string): string | undefined {
  // "GREASE & THREADS SERVICE CALLS (Customer Name)" → "Customer Name"
  const match = summary.match(/\(([^)]+)\)/);
  return match?.[1]?.trim();
}

// ── Determine if an event is a GnT appointment booking ───────────────────────

function isAppointmentEvent(summary: string): boolean {
  const upper = summary.toUpperCase();
  return (
    upper.includes("GREASE & THREADS") ||
    upper.includes("GREASE AND THREADS") ||
    upper.includes("SERVICE CALL") ||
    upper.includes("APPOINTMENT")
  );
}

// ── Google OAuth client ───────────────────────────────────────────────────────

function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN."
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

// ── Fetch events from Google Calendar ────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function fetchCalendarEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const auth = getGoogleAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date(startDate).toISOString(),
    timeMax: new Date(endDate).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  return (response.data.items || []) as CalendarEvent[];
}

// ── Main sync function ────────────────────────────────────────────────────────

export interface SyncResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function syncCalendarEvents(
  startDate?: string,
  endDate?: string
): Promise<SyncResult> {
  const now = new Date();

  // Default: -30 days to +60 days
  const start =
    startDate ||
    (() => {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.toISOString().split("T")[0];
    })();

  const end =
    endDate ||
    (() => {
      const d = new Date(now);
      d.setDate(d.getDate() + 60);
      return d.toISOString().split("T")[0];
    })();

  const result: SyncResult = { created: 0, skipped: 0, errors: [] };

  let events: CalendarEvent[];
  try {
    events = await fetchCalendarEvents(start, end);
  } catch (err) {
    result.errors.push(`Failed to fetch calendar events: ${String(err)}`);
    return result;
  }

  console.log(`[Calendar Sync] Fetched ${events.length} events from ${start} to ${end}`);

  for (const event of events) {
    try {
      if (!event.id) continue;
      if (!event.summary) continue;

      // Only process GnT appointment events
      if (!isAppointmentEvent(event.summary)) {
        continue;
      }

      // Deduplication check
      const existing = await dbGetJobByCalendarEventId(event.id);
      if (existing) {
        console.log(`[Calendar Sync] Skipping already-synced event: ${event.id} (job ${existing.jobNumber})`);
        result.skipped++;
        continue;
      }

      // Parse description
      const parsed = event.description
        ? parseEventDescription(event.description)
        : {};

      // Name: prefer summary extraction, fall back to description
      const customerName =
        extractNameFromSummary(event.summary) ||
        parsed.customerName ||
        "Unknown Customer";

      // Require at least customerName to create a job
      if (!customerName || customerName === "Unknown Customer") {
        if (!parsed.customerPhone && !parsed.customerEmail) {
          console.warn(
            `[Calendar Sync] Skipping event ${event.id} — missing customer info`
          );
          result.skipped++;
          continue;
        }
      }

      // Normalize scheduled time
      const rawDateTime = event.start?.dateTime || event.start?.date;
      const scheduledAt = rawDateTime
        ? new Date(rawDateTime).toISOString()
        : undefined;

      // Create the job
      const job = await dbCreateJob({
        customerName,
        customerPhone: parsed.customerPhone || "",
        customerEmail: parsed.customerEmail || "",
        serviceType: "HVAC",
        problemDescription:
          parsed.problemDescription || `Service call from calendar: ${event.summary}`,
        address: parsed.address || "",
        scheduledAt,
        status: "Scheduled",
        leadSource: "google_calendar",
        notes: `Auto-synced from Google Calendar event ID: ${event.id}`,
      });

      // Store the calendar event ID for deduplication
      await dbSetJobCalendarEventId(job.id, event.id);

      console.log(
        `[Calendar Sync] Created job ${job.jobNumber} for event ${event.id} (${customerName})`
      );
      result.created++;
    } catch (err) {
      const msg = `Error processing event ${event.id}: ${String(err)}`;
      console.error(`[Calendar Sync] ${msg}`);
      result.errors.push(msg);
    }
  }

  return result;
}
