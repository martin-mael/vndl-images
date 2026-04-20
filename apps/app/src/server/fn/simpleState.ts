import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "../auth";
import { delByUrl } from "../blob";
import { db, schema } from "../db/client";

export const simpleStateSchema = z.object({
	imageUrl: z.string().nullable(),
	darkColor: z.string(),
	lightColor: z.string(),
	cellW: z.number(),
	cellH: z.number(),
	gamma: z.number(),
	rotation: z.number(),
});

export type SimpleState = z.infer<typeof simpleStateSchema>;

export const defaultSimpleState: SimpleState = {
	imageUrl: null,
	darkColor: "#082463",
	lightColor: "#39a2ff",
	cellW: 16,
	cellH: 8,
	gamma: 0.8,
	rotation: 45,
};

async function requireSession() {
	const request = getRequest();
	if (!request) throw new Error("No request context");
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	return session;
}

export const loadSimpleState = createServerFn({ method: "GET" }).handler(
	async (): Promise<SimpleState> => {
		const session = await requireSession();
		const row = await db
			.select()
			.from(schema.simpleStates)
			.where(eq(schema.simpleStates.userId, session.user.id))
			.get();
		if (!row) return defaultSimpleState;
		const parsed = simpleStateSchema.safeParse(JSON.parse(row.state));
		return parsed.success ? parsed.data : defaultSimpleState;
	},
);

export const saveSimpleState = createServerFn({ method: "POST" })
	.inputValidator(simpleStateSchema)
	.handler(async ({ data }) => {
		const session = await requireSession();
		const existing = await db
			.select()
			.from(schema.simpleStates)
			.where(eq(schema.simpleStates.userId, session.user.id))
			.get();

		// If the image URL changed, delete the previous blob.
		if (existing) {
			const prev = simpleStateSchema.safeParse(JSON.parse(existing.state));
			if (prev.success && prev.data.imageUrl && prev.data.imageUrl !== data.imageUrl) {
				await delByUrl(prev.data.imageUrl);
			}
		}

		const payload = {
			userId: session.user.id,
			state: JSON.stringify(data),
			updatedAt: new Date(),
		};
		if (existing) {
			await db
				.update(schema.simpleStates)
				.set(payload)
				.where(eq(schema.simpleStates.userId, session.user.id));
		} else {
			await db.insert(schema.simpleStates).values(payload);
		}
		return { ok: true as const };
	});
