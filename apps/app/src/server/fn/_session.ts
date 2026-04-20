import { getRequest } from "@tanstack/react-start/server";
import { auth } from "../auth";

export async function requireSession() {
	const request = getRequest();
	if (!request) throw new Error("No request context");
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	return session;
}
