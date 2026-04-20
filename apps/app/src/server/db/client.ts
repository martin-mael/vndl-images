import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

function init(): Db {
	const url = process.env.TURSO_DATABASE_URL;
	if (!url) {
		throw new Error(
			"TURSO_DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
		);
	}
	const authToken = process.env.TURSO_AUTH_TOKEN;
	return drizzle(createClient({ url, authToken }), { schema });
}

export const db = new Proxy({} as Db, {
	get(_target, prop, receiver) {
		if (!_db) _db = init();
		return Reflect.get(_db, prop, receiver);
	},
});

export { schema };
