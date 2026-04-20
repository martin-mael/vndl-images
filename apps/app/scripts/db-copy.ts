// Copy rows from one Turso DB into another, in FK-safe order.
// Usage:
//   DEV_TURSO_DATABASE_URL=... DEV_TURSO_AUTH_TOKEN=... \
//   PROD_TURSO_DATABASE_URL=... PROD_TURSO_AUTH_TOKEN=... \
//   bun scripts/db-copy.ts
//
// Uses INSERT OR IGNORE, so re-running is safe (won't overwrite existing rows).

import { createClient } from "@libsql/client";

const DEV_URL = process.env.DEV_TURSO_DATABASE_URL;
const DEV_TOKEN = process.env.DEV_TURSO_AUTH_TOKEN;
const PROD_URL = process.env.PROD_TURSO_DATABASE_URL;
const PROD_TOKEN = process.env.PROD_TURSO_AUTH_TOKEN;

if (!DEV_URL || !PROD_URL) {
	console.error(
		"Required env vars: DEV_TURSO_DATABASE_URL (+ token), PROD_TURSO_DATABASE_URL (+ token)",
	);
	process.exit(1);
}

// FK-safe insertion order.
const TABLES = [
	"user",
	"account",
	"session",
	"verification",
	"projects",
	"story_templates",
	"simple_states",
	"exports",
];

const dev = createClient({ url: DEV_URL, authToken: DEV_TOKEN });
const prod = createClient({ url: PROD_URL, authToken: PROD_TOKEN });

for (const table of TABLES) {
	const rs = await dev.execute(`SELECT * FROM "${table}"`);
	if (rs.rows.length === 0) {
		console.log(`${table}: 0 rows`);
		continue;
	}
	const cols = rs.columns;
	const colList = cols.map((c) => `"${c}"`).join(", ");
	const placeholders = cols.map(() => "?").join(", ");
	const sql = `INSERT OR IGNORE INTO "${table}" (${colList}) VALUES (${placeholders})`;
	for (const row of rs.rows) {
		const values = cols.map((_, i) => (row as unknown as unknown[])[i]);
		await prod.execute({ sql, args: values as never });
	}
	console.log(`${table}: copied ${rs.rows.length} rows`);
}

dev.close();
prod.close();
console.log("\nAll tables copied.");
