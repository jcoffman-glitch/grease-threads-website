#!/usr/bin/env node
/**
 * One-time migration: seed 3 existing social posts from legacy crons into Turso DB.
 * Run: node scripts/migrate-social-posts.js
 */

const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

// Manually load .env.local since dotenv may not be installed
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Creating social_posts table if not exists...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS social_posts (
      id TEXT PRIMARY KEY,
      post_type TEXT DEFAULT 'Other',
      context_notes TEXT,
      generated_content TEXT,
      scheduled_at TEXT,
      status TEXT DEFAULT 'Draft',
      revision_notes TEXT,
      fb_post_id TEXT,
      fb_post_url TEXT,
      posted_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  console.log("Inserting 3 legacy posts...");

  const posts = [
    {
      id: "reznor-rtu-story-20260326",
      post_type: "Job Story",
      context_notes: "Legacy post migrated from cron 8b34928b",
      generated_content: `🔧 **Everyone Else Said It Was Junk. I Got It Running.**

Had a customer call last fall with an old **Reznor RTU** (rooftop unit) that hadn't run in 2 years.

Previous owner had cut corners. To get it running "quick," they installed jumpers that **bypassed all the safety switches**. Big red flag. That's how equipment catches fire or fails catastrophically.

Most techs would've said, "That's ancient. Replace it." Could've been a $10,000+ job.

Instead, I spent a couple days doing it right:
- Removed all the jumpers
- Rewired the unit properly
- Reinstalled every safety switch
- Made sure it ran clean and safe

Customer's been running it all winter with **zero failures.** Just talked to them the other day — it's been solid.

**Here's the thing:** I've got 30 years under my belt diagnosing systems nobody else understands. Old equipment, legacy units, weird configurations — that's my wheelhouse. When someone else says "it's done," I figure out if it can be saved.

If you've got equipment that's been sitting, acting up, or that other shops gave up on — give me a call. Let's see if we can get it running right.

📞 **Call Grease & Threads:** 812-564-3719
📅 **Book Online:** https://calendar.app.google/NEBSdUFjbUY7yPxF6

#HVAC #RTU #Legacy #Diagnostics #EquipmentRepair #CarlisleIndiana #GreaseAndThreads`,
      scheduled_at: "2026-03-28T15:00:00Z",
      status: "Approved",
    },
    {
      id: "dirty-evaporators-20260326",
      post_type: "Educational Tip",
      context_notes: "Legacy post migrated from cron ee6c2a5b",
      generated_content: `💨 Your AC is Running But Not Cooling Like It Should?

Could be a dirty evaporator.

Your air conditioner has two main parts: the **condenser** (outside unit) and the **evaporator** (inside unit). The evaporator is the part that actually cools your air. When it gets dirty — covered in dust, dirt, and debris — bad things happen.

**Why a dirty evaporator is a problem:**

🔴 **Reduced cooling** — Dirty coils can't absorb heat like they should. You run the AC all day and the house stays warm.

🔴 **Frozen coils** — Sometimes a dirty evaporator gets TOO cold and ice forms on the coils. Then your AC shuts down completely.

🔴 **Mold and mildew** — Moisture builds up on dirty coils. This creates mold, which spreads through your ducts and into your home. Not good for your lungs.

🔴 **Your system works harder** — Dirty coils mean your compressor runs longer, uses more power, and wears out faster. That's expensive.

**The good news?** A clean evaporator coil is one of the first things I check during a tune-up. Most of the time, cleaning it solves your cooling problems without replacing anything.

If your AC isn't cooling like it should, give me a call. I'll diagnose it and get you back to comfortable.

📞 **Call Grease & Threads:** 812-564-3719
📅 **Book Online:** https://calendar.app.google/NEBSdUFjbUY7yPxF6

#HVAC #AirConditioning #ACRepair #Maintenance #CarlisleIndiana #GreaseAndThreads`,
      scheduled_at: "2026-03-31T15:00:00Z",
      status: "Approved",
    },
    {
      id: "residential-subscription-20260326",
      post_type: "Service Offer",
      context_notes: "Legacy post migrated from cron c970c93a",
      generated_content: `✏️ **Your AC Dies on the Hottest Day of Summer.**

It's 92°F outside. You call around. Every tech is booked for the next week. You finally get someone at $200+ emergency call rate. They find the problem: a $400 capacitor that failed.

Two days of sleeping with fans. $600 out of pocket.

**Sound familiar?**

Here's what I've learned in 30 years of emergency calls: **Most breakdowns are preventable.**

That's why I offer a **$75/month maintenance subscription** for homeowners. Here's what it includes:

✓ **2 scheduled tune-ups per year** (spring and fall)
✓ Full electrical check (motor amps, capacitors, contactors)
✓ New filters + unit cleaning
✓ Pressure, subcool, superheat checks
✓ Priority scheduling (you get in first)
✓ **No emergency response fee** (huge savings when something goes wrong)

**The math:**
- Emergency AC repair: $500-$2,000
- Annual subscription: $900
- Peace of mind: Priceless

Most of my subscription customers never have an emergency because we catch problems early. A weak capacitor becomes a $50 replacement instead of a $400 emergency.

**Ready to stop worrying about your AC?**

📞 **Call Grease & Threads:** 812-564-3719
📅 **Book Online:** https://calendar.app.google/NEBSdUFjbUY7yPxF6

Ask about our $75/month maintenance subscription. First inspection is part of the sign-up.

#HVAC #AirConditioning #Maintenance #Prevention #PeaceOfMind #CarlisleIndiana #GreaseAndThreads`,
      scheduled_at: "2026-04-02T15:00:00Z",
      status: "Approved",
    },
  ];

  for (const post of posts) {
    // Use INSERT OR IGNORE so re-runs are safe
    await db.execute({
      sql: `INSERT OR IGNORE INTO social_posts (id, post_type, context_notes, generated_content, scheduled_at, status, revision_notes, fb_post_id, fb_post_url, posted_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, '2026-03-26T10:00:00Z', '2026-03-26T10:00:00Z')`,
      args: [
        post.id,
        post.post_type,
        post.context_notes,
        post.generated_content,
        post.scheduled_at,
        post.status,
      ],
    });
    console.log(`  ✓ Inserted: ${post.id}`);
  }

  // Verify
  const result = await db.execute("SELECT id, post_type, status, scheduled_at FROM social_posts ORDER BY scheduled_at");
  console.log("\nVerification — all social_posts rows:");
  for (const row of result.rows) {
    console.log(`  - ${row.id} | ${row.post_type} | ${row.status} | ${row.scheduled_at}`);
  }

  console.log("\n✅ Migration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
