import { createClient } from "@libsql/client/http";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  `CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    job_number TEXT UNIQUE,
    created_at TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    service_type TEXT,
    problem_description TEXT,
    address TEXT,
    scheduled_at TEXT,
    status TEXT DEFAULT 'Lead',
    notes TEXT,
    tracking_token TEXT UNIQUE,
    google_review_sent INTEGER DEFAULT 0,
    sheets_synced INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS job_items (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    item_type TEXT,
    description TEXT,
    quantity REAL DEFAULT 1,
    unit_price REAL,
    created_at TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  )`,
  `CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    part_number TEXT UNIQUE,
    description TEXT,
    category TEXT,
    qty_on_hand REAL DEFAULT 0,
    reorder_point REAL DEFAULT 2,
    unit_cost REAL,
    retail_price REAL,
    supplier TEXT,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE,
    job_id TEXT,
    created_at TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    subtotal REAL,
    tax REAL DEFAULT 0,
    total REAL,
    status TEXT DEFAULT 'Draft',
    paid_at TEXT,
    notes TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS price_list (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    default_price REAL,
    item_type TEXT
  )`,
];

console.log("Running migrations against:", process.env.TURSO_DATABASE_URL);

for (const sql of migrations) {
  const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
  try {
    await client.execute(sql);
    console.log(`✓ ${tableName}`);
  } catch (e) {
    console.error(`✗ ${tableName}:`, e.message);
    process.exit(1);
  }
}

console.log("Migration complete.");
