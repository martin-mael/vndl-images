export async function uploadImage(file: File, deletePrev?: string | null): Promise<string> {
	const fd = new FormData();
	fd.set("file", file);
	fd.set("kind", "image");
	if (deletePrev) fd.set("deletePrev", deletePrev);
	const res = await fetch("/api/upload", { method: "POST", body: fd });
	if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
	const { url } = (await res.json()) as { url: string };
	return url;
}

export async function uploadPng(blob: Blob): Promise<string> {
	const fd = new FormData();
	fd.set("file", new File([blob], "export.png", { type: "image/png" }));
	fd.set("kind", "png");
	const res = await fetch("/api/upload", { method: "POST", body: fd });
	if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
	const { url } = (await res.json()) as { url: string };
	return url;
}
