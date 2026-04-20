import { del, put } from "@vercel/blob";

const token = process.env.BLOB_READ_WRITE_TOKEN;

export async function putPublic(key: string, body: Blob | ArrayBuffer | Buffer | string, contentType?: string) {
	if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
	const res = await put(key, body, {
		access: "public",
		token,
		contentType,
		addRandomSuffix: false,
	});
	return res.url;
}

export async function delByUrl(url: string | null | undefined) {
	if (!url || !token) return;
	try {
		await del(url, { token });
	} catch {
		// swallow — the blob may already be gone
	}
}

const IMAGE_CONTENT_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/avif",
]);

export function inferImageExt(type: string): string {
	switch (type) {
		case "image/png":
			return "png";
		case "image/jpeg":
			return "jpg";
		case "image/webp":
			return "webp";
		case "image/gif":
			return "gif";
		case "image/avif":
			return "avif";
		default:
			return "bin";
	}
}

export function isAllowedImageType(type: string): boolean {
	return IMAGE_CONTENT_TYPES.has(type);
}
