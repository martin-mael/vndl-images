import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/server/auth";
import {
	delByUrl,
	inferImageExt,
	isAllowedImageType,
	putPublic,
} from "@/server/blob";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const Route = createFileRoute("/api/upload")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return new Response("Unauthorized", { status: 401 });
				}

				const form = await request.formData();
				const file = form.get("file");
				const kind = form.get("kind")?.toString() ?? "image"; // "image" | "png"
				const deletePrev = form.get("deletePrev")?.toString() || null;

				if (!(file instanceof File)) {
					return new Response("Missing file", { status: 400 });
				}
				if (file.size > MAX_BYTES) {
					return new Response("File too large", { status: 413 });
				}
				if (kind === "image" && !isAllowedImageType(file.type)) {
					return new Response("Unsupported image type", { status: 415 });
				}

				const ext = kind === "png" ? "png" : inferImageExt(file.type);
				const folder = kind === "png" ? "exports" : "images";
				const key = `${folder}/${crypto.randomUUID()}.${ext}`;
				const url = await putPublic(key, file, file.type);

				if (deletePrev) await delByUrl(deletePrev);

				return Response.json({ url });
			},
		},
	},
});
