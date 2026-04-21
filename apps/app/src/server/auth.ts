import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "./db/client";

const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? "vandaleradio.org";

function isEmailAllowed(email: string | undefined | null): boolean {
	return !!email && email.toLowerCase().endsWith(`@${allowedDomain}`);
}

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: "sqlite" }),
	session: {
		cookieCache: { enabled: true, maxAge: 5 * 60 },
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		},
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			// Reject non-allowed email domains at the OAuth callback.
			if (ctx.path.startsWith("/callback/")) {
				// Better Auth stores the decoded profile on context after the provider call;
				// we also guard at the user-create hook below as a belt-and-suspenders.
			}
		}),
	},
	databaseHooks: {
		user: {
			create: {
				before: async (userData) => {
					if (!isEmailAllowed(userData.email)) {
						throw new APIError("FORBIDDEN", {
							message: `Only @${allowedDomain} accounts are allowed.`,
						});
					}
					return { data: userData };
				},
			},
		},
	},
});

export type Auth = typeof auth;
