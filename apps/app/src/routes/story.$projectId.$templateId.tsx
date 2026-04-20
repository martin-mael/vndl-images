import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	PosterEditor,
	type PosterState,
	defaultPosterState,
} from "@/components/PosterEditor";
import { uploadPng } from "@/lib/upload";
import { createExport } from "@/server/fn/exports";
import { getProject } from "@/server/fn/projects";
import {
	deleteTemplate,
	getTemplate,
	parseTemplateState,
	saveTemplate,
} from "@/server/fn/templates";

export const Route = createFileRoute("/story/$projectId/$templateId")({
	component: TemplateEditorPage,
	loader: async ({ params }) => {
		const [template, project] = await Promise.all([
			getTemplate({ data: { id: params.templateId } }),
			getProject({ data: { id: params.projectId } }),
		]);
		return { template, project };
	},
});

function TemplateEditorPage() {
	const { template, project } = Route.useLoaderData();
	const { projectId } = Route.useParams();
	const router = useRouter();

	if (!template || !project) {
		return (
			<div className="p-6 text-sm text-ink-300">
				Template not found.{" "}
				<Link to="/story" className="text-accent">
					Go back
				</Link>
			</div>
		);
	}

	const initial: PosterState = parseTemplateState(template.state) ?? defaultPosterState();
	const [name, setName] = useState(template.name);
	const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
	const latest = useRef<{ state: PosterState; name: string }>({
		state: initial,
		name: template.name,
	});
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const flush = useCallback(async () => {
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		setSaveStatus("saving");
		try {
			await saveTemplate({
				data: {
					id: template.id,
					name: latest.current.name,
					state: latest.current.state,
				},
			});
			setSaveStatus("saved");
		} catch (e) {
			console.error(e);
			setSaveStatus("idle");
		}
	}, [template.id]);

	const scheduleSave = useCallback(() => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(flush, 600);
	}, [flush]);

	useEffect(() => {
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	const handleStateChange = useCallback(
		(state: PosterState) => {
			latest.current.state = state;
			scheduleSave();
		},
		[scheduleSave],
	);

	const handleAfterDownload = useCallback(
		async (blob: Blob) => {
			const pngUrl = await uploadPng(blob);
			await createExport({
				data: {
					projectId,
					templateId: template.id,
					title: `${latest.current.state.title} ${latest.current.state.issue}`.trim(),
					pngUrl,
				},
			});
		},
		[projectId, template.id],
	);

	const handleRename = (v: string) => {
		setName(v);
		latest.current.name = v;
		scheduleSave();
	};

	const handleDelete = async () => {
		if (!confirm("Delete this template?")) return;
		await deleteTemplate({ data: { id: template.id } });
		router.navigate({ to: "/story/$projectId", params: { projectId } });
	};

	const headerSlot = (
		<header className="flex flex-col gap-2">
			<nav className="flex items-center gap-1 text-[11px] text-ink-400">
				<Link to="/story" className="hover:text-ink-100">
					Projects
				</Link>
				<span>/</span>
				<Link
					to="/story/$projectId"
					params={{ projectId }}
					className="hover:text-ink-100"
				>
					{project.name}
				</Link>
			</nav>
			<div className="flex items-center gap-2">
				<Link
					to="/story/$projectId"
					params={{ projectId }}
					className="rounded border border-ink-700 p-1 text-ink-400 hover:border-ink-500 hover:text-ink-100"
					aria-label="Back"
				>
					<ChevronLeft size={14} />
				</Link>
				<input
					value={name}
					onChange={(e) => handleRename(e.target.value)}
					className="flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-ink-50 hover:border-ink-700 focus:border-accent focus:outline-none"
				/>
				<button
					type="button"
					onClick={handleDelete}
					aria-label="Delete template"
					className="rounded border border-ink-700 p-1 text-ink-400 hover:border-red-500 hover:text-red-400"
				>
					<Trash2 size={14} />
				</button>
			</div>
			<SaveStatus status={saveStatus} />
		</header>
	);

	return (
		<PosterEditor
			initialState={initial}
			onStateChange={handleStateChange}
			onAfterDownload={handleAfterDownload}
			headerSlot={headerSlot}
		/>
	);
}

function SaveStatus({ status }: { status: "idle" | "saving" | "saved" }) {
	if (status === "idle") return <span className="h-3" />;
	return (
		<span className="flex items-center gap-1 text-[10px] text-ink-400">
			{status === "saving" ? (
				<>
					<Loader2 size={10} className="animate-spin" /> Saving…
				</>
			) : (
				<>Saved</>
			)}
		</span>
	);
}
