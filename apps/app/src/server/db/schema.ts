import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── Better Auth tables ────────────────────────────────────────────────────

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ─── App tables ────────────────────────────────────────────────────────────

export const projects = sqliteTable("projects", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdById: text("createdById")
		.notNull()
		.references(() => user.id),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const storyTemplates = sqliteTable("story_templates", {
	id: text("id").primaryKey(),
	projectId: text("projectId")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	state: text("state").notNull(), // JSON of PosterState
	createdById: text("createdById")
		.notNull()
		.references(() => user.id),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedById: text("updatedById")
		.notNull()
		.references(() => user.id),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const simpleStates = sqliteTable("simple_states", {
	userId: text("userId")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	state: text("state").notNull(), // JSON of SimpleState
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const exports = sqliteTable("exports", {
	id: text("id").primaryKey(),
	projectId: text("projectId")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	templateId: text("templateId").references(() => storyTemplates.id, {
		onDelete: "set null",
	}),
	title: text("title").notNull(),
	pngUrl: text("pngUrl").notNull(),
	createdById: text("createdById")
		.notNull()
		.references(() => user.id),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export type User = typeof user.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type StoryTemplate = typeof storyTemplates.$inferSelect;
export type SimpleStateRow = typeof simpleStates.$inferSelect;
export type ExportRow = typeof exports.$inferSelect;
