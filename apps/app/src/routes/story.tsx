import { createFileRoute } from "@tanstack/react-router";
import { PosterEditor } from "@/components/PosterEditor";

export const Route = createFileRoute("/story")({
	component: PosterEditor,
});
