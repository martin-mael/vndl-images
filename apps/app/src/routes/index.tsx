import { createFileRoute } from "@tanstack/react-router";
import { Editor } from "@/components/Editor";
import { loadSimpleState } from "@/server/fn/simpleState";

export const Route = createFileRoute("/")({
	component: Editor,
	loader: () => loadSimpleState(),
});
