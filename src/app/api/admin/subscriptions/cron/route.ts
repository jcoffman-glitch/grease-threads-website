import { dbGetSubscriptions, dbCreateJob, dbUpdateSubscription } from "@/lib/db";

// Cron stub: creates work orders N days before subscription next_due date
// In prod, call this route via Vercel Cron or external scheduler
// In dev, can be triggered manually: GET /api/admin/subscriptions/cron

const DAYS_BEFORE_DUE = 3;

function calculateNextDue(current: string, recurrence: string): string {
  const date = new Date(current);
  try {
    const rec = JSON.parse(recurrence);
    switch (rec.type) {
      case "weekly":
        date.setDate(date.getDate() + 7 * (rec.every || 1));
        break;
      case "monthly":
        date.setMonth(date.getMonth() + (rec.every || 1));
        break;
      case "day_of_week": {
        // Next occurrence of specified day
        date.setDate(date.getDate() + 7);
        break;
      }
      case "nth_weekday": {
        // Move to next month, then find nth weekday
        date.setMonth(date.getMonth() + 1);
        break;
      }
      case "quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
  } catch {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const subs = await dbGetSubscriptions();
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + DAYS_BEFORE_DUE);

    let created = 0;

    for (const sub of subs) {
      if (sub.status !== "active") continue;
      if (!sub.nextDue) continue;

      const dueDate = new Date(sub.nextDue);
      if (dueDate > threshold || dueDate < now) continue;

      // Create a work order for this subscription
      const planLabel = sub.planType === "commercial" ? "Commercial" : "Residential";
      await dbCreateJob({
        customerName: sub.customerName || `Customer ${sub.customerId}`,
        customerPhone: sub.customerPhone || "",
        customerEmail: sub.customerEmail || "",
        serviceType: "HVAC",
        problemDescription: `[Subscription] ${planLabel} maintenance visit`,
        status: "Scheduled",
        scheduledAt: sub.nextDue,
        notes: sub.notes || "",
        subscriptionFlag: true,
      });

      // Advance next_due
      const nextDue = calculateNextDue(sub.nextDue, sub.recurrence);
      await dbUpdateSubscription(sub.id, { nextDue });

      console.log(`[Subscription Cron] Created work order for subscription ${sub.id}, next due: ${nextDue}`);
      created++;
    }

    return Response.json({ success: true, workOrdersCreated: created });
  } catch (e) {
    console.error("Subscription cron error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
