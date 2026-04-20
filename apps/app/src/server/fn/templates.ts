import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { delByUrl } from "../blob";
import { db, schema } from "../db/client";
import { requireSession } from "./_session";

const halftoneParamsSchema = z.object({
	cellW: z.number(),
	cellH: z.number(),
	gamma: z.number(),
	rotation: z.number(),
});

const imageSlotSchema = z.object({
	src: z.string().nullable(),
	params: halftoneParamsSchema,
	dark: z.string(),
	light: z.string(),
});

const posterStateSchema = z.object({
	background: imageSlotSchema,
	frameImg: imageSlotSchema,
	textBlockImg: imageSlotSchema,
	title: z.string(),
	issue: z.string(),
	day: z.string(),
	timeStart: z.string(),
	timeEnd: z.string(),
	topText: z.string(),
	bottomText: z.string(),
	colors: z.object({
		textColor: z.string(),
		arrowColor: z.string(),
		logoColor: z.string().default("#000000"),
	}),
});

export type PosterState = z.infer<typeof posterStateSchema>;

export const listTemplates = createServerFn({ method: "GET" })
	.inputValidator(z.object({ projectId: z.string() }))
	.handler(async ({ data }) => {
		await requireSession();
		const rows = await db
			.select()
			.from(schema.storyTemplates)
			.where(eq(schema.storyTemplates.projectId, data.projectId))
			.orderBy(desc(schema.storyTemplates.updatedAt))
			.all();
		return rows;
	});

export const getTemplate = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireSession();
		const row = await db
			.select()
			.from(schema.storyTemplates)
			.where(eq(schema.storyTemplates.id, data.id))
			.get();
		return row ?? null;
	});

export const createTemplate = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			projectId: z.string(),
			name: z.string().trim().min(1).max(120),
			state: posterStateSchema,
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireSession();
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(schema.storyTemplates).values({
			id,
			projectId: data.projectId,
			name: data.name,
			state: JSON.stringify(data.state),
			createdById: session.user.id,
			updatedById: session.user.id,
			createdAt: now,
			updatedAt: now,
		});
		// Bump project's updatedAt for sorting.
		await db
			.update(schema.projects)
			.set({ updatedAt: now })
			.where(eq(schema.projects.id, data.projectId));
		return { id };
	});

export const saveTemplate = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			name: z.string().trim().min(1).max(120),
			state: posterStateSchema,
			expectedUpdatedAt: z.number().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireSession();
		const existing = await db
			.select()
			.from(schema.storyTemplates)
			.where(eq(schema.storyTemplates.id, data.id))
			.get();
		if (!existing) throw new Error("Template not found");

		const stale =
			data.expectedUpdatedAt !== undefined &&
			existing.updatedAt.getTime() !== data.expectedUpdatedAt;

		// Delete orphaned image blobs when the template's image URLs change.
		try {
			const prev = JSON.parse(existing.state) as PosterState;
			const slots: (keyof PosterState & ("background" | "frameImg" | "textBlockImg"))[] = [
				"background",
				"frameImg",
				"textBlockImg",
			];
			for (const slot of slots) {
				const prevUrl = prev[slot]?.src ?? null;
				const nextUrl = data.state[slot]?.src ?? null;
				if (prevUrl && prevUrl !== nextUrl) {
					await delByUrl(prevUrl);
				}
			}
		} catch {
			// parse fail — skip cleanup
		}

		const now = new Date();
		await db
			.update(schema.storyTemplates)
			.set({
				name: data.name,
				state: JSON.stringify(data.state),
				updatedById: session.user.id,
				updatedAt: now,
			})
			.where(eq(schema.storyTemplates.id, data.id));
		await db
			.update(schema.projects)
			.set({ updatedAt: now })
			.where(eq(schema.projects.id, existing.projectId));
		return { ok: true as const, stale, updatedAt: now.getTime() };
	});

export const renameTemplate = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string(), name: z.string().trim().min(1).max(120) }))
	.handler(async ({ data }) => {
		const session = await requireSession();
		await db
			.update(schema.storyTemplates)
			.set({ name: data.name, updatedById: session.user.id, updatedAt: new Date() })
			.where(eq(schema.storyTemplates.id, data.id));
		return { ok: true as const };
	});

export const deleteTemplate = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireSession();
		const existing = await db
			.select()
			.from(schema.storyTemplates)
			.where(eq(schema.storyTemplates.id, data.id))
			.get();
		if (!existing) return { ok: true as const };

		// Delete associated image blobs (not exports — those live on).
		try {
			const state = JSON.parse(existing.state) as PosterState;
			for (const slot of ["background", "frameImg", "textBlockImg"] as const) {
				const url = state[slot]?.src ?? null;
				if (url) await delByUrl(url);
			}
		} catch {
			// ignore
		}

		await db.delete(schema.storyTemplates).where(eq(schema.storyTemplates.id, data.id));
		return { ok: true as const };
	});

export function parseTemplateState(json: string): PosterState | null {
	try {
		const parsed = posterStateSchema.safeParse(JSON.parse(json));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export { posterStateSchema };

// Small helper to use `and` + `eq` without unused-import lint.
void and;
