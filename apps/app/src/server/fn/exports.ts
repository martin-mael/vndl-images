import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { delByUrl } from "../blob";
import { db, schema } from "../db/client";
import { requireSession } from "./_session";

export const listExports = createServerFn({ method: "GET" })
	.inputValidator(z.object({ projectId: z.string().optional() }).optional())
	.handler(async ({ data }) => {
		await requireSession();
		const query = db
			.select({
				id: schema.exports.id,
				projectId: schema.exports.projectId,
				templateId: schema.exports.templateId,
				title: schema.exports.title,
				pngUrl: schema.exports.pngUrl,
				createdById: schema.exports.createdById,
				createdAt: schema.exports.createdAt,
				projectName: schema.projects.name,
				createdByName: schema.user.name,
				createdByEmail: schema.user.email,
			})
			.from(schema.exports)
			.leftJoin(schema.projects, eq(schema.exports.projectId, schema.projects.id))
			.leftJoin(schema.user, eq(schema.exports.createdById, schema.user.id))
			.orderBy(desc(schema.exports.createdAt));
		const rows = data?.projectId
			? await query.where(eq(schema.exports.projectId, data.projectId)).all()
			: await query.all();
		return rows;
	});

export const createExport = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			projectId: z.string(),
			templateId: z.string().nullable(),
			title: z.string(),
			pngUrl: z.string().url(),
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireSession();
		const id = crypto.randomUUID();
		await db.insert(schema.exports).values({
			id,
			projectId: data.projectId,
			templateId: data.templateId,
			title: data.title,
			pngUrl: data.pngUrl,
			createdById: session.user.id,
			createdAt: new Date(),
		});
		return { id };
	});

export const deleteExport = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const session = await requireSession();
		const row = await db
			.select()
			.from(schema.exports)
			.where(eq(schema.exports.id, data.id))
			.get();
		if (!row) return { ok: true as const };
		// Only the creator can delete their own exports.
		if (row.createdById !== session.user.id) {
			throw new Error("Forbidden");
		}
		await delByUrl(row.pngUrl);
		await db.delete(schema.exports).where(eq(schema.exports.id, data.id));
		return { ok: true as const };
	});
