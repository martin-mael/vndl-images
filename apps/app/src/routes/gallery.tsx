import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery")({
	component: GalleryPage,
});

function GalleryPage() {
	return (
		<div className="flex h-full items-center justify-center p-6 text-ink-300">
			<p className="text-sm">Gallery — coming in Phase 5.</p>
		</div>
	);
}
