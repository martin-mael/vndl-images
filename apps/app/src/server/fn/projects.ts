import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/client";
import { requireSession } from "./_session";

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
	await requireSession();
	const rows = await db
		.select()
		.from(schema.projects)
		.orderBy(desc(schema.projects.updatedAt))
		.all();
	return rows;
});

export const getProject = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireSession();
		const row = await db
			.select()
			.from(schema.projects)
			.where(eq(schema.projects.id, data.id))
			.get();
		return row ?? null;
	});

export const createProject = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string().trim().min(1).max(120) }))
	.handler(async ({ data }) => {
		const session = await requireSession();
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(schema.projects).values({
			id,
			name: data.name,
			createdById: session.user.id,
			createdAt: now,
			updatedAt: now,
		});
		return { id };
	});

export const renameProject = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string(), name: z.string().trim().min(1).max(120) }))
	.handler(async ({ data }) => {
		await requireSession();
		await db
			.update(schema.projects)
			.set({ name: data.name, updatedAt: new Date() })
			.where(eq(schema.projects.id, data.id));
		return { ok: true as const };
	});

export const deleteProject = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireSession();
		// Cascade drops templates + exports via FK ON DELETE CASCADE,
		// but we still need to clean up blobs. Do that in templates/exports fns
		// if called with a project id; for now, naive cascade.
		await db.delete(schema.projects).where(eq(schema.projects.id, data.id));
		return { ok: true as const };
	});
