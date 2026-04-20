import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL not set");

const client = createClient({ url, authToken });

const tables = [
	"exports",
	"story_templates",
	"projects",
	"simple_states",
	"verification",
	"session",
	"account",
	"user",
	"__drizzle_migrations",
];

for (const t of tables) {
	try {
		await client.execute(`DROP TABLE IF EXISTS ${t}`);
		console.log(`dropped ${t}`);
	} catch (e) {
		console.warn(`skip ${t}:`, e);
	}
}

client.close();
console.log("done. Now run: bun run db:push");
