import { createFileRoute } from "@tanstack/react-router";
import { Editor } from "@/components/Editor";
import { simpleStateQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/")({
	component: Editor,
	loader: ({ context }) => context.queryClient.ensureQueryData(simpleStateQueryOptions()),
});
