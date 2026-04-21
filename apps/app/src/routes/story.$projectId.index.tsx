import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { defaultPosterState } from "@/components/PosterEditor";
import { projectQueryOptions, templatesQueryOptions } from "@/lib/queries";
import { renameProject } from "@/server/fn/projects";
import { createTemplate, deleteTemplate, renameTemplate } from "@/server/fn/templates";

export const Route = createFileRoute("/story/$projectId/")({
	component: TemplatesPage,
	loader: async ({ params, context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(projectQueryOptions(params.projectId)),
			context.queryClient.ensureQueryData(templatesQueryOptions(params.projectId)),
		]);
	},
});

function TemplatesPage() {
	const { projectId } = Route.useParams();
	const { data: project } = useSuspenseQuery(projectQueryOptions(projectId));
	const { data: templates } = useSuspenseQuery(templatesQueryOptions(projectId));
	const queryClient = useQueryClient();
	const router = useRouter();
	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [editingProject, setEditingProject] = useState(false);
	const [projectDraft, setProjectDraft] = useState("");
	const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
	const [templateDraft, setTemplateDraft] = useState("");

	if (!project) {
		return <div className="p-6 text-sm text-ink-300">Project not found.</div>;
	}

	const invalidateTemplates = () =>
		queryClient.invalidateQueries({ queryKey: ["templates", projectId] });

	const handleCreate = async () => {
		if (!newName.trim()) return;
		const { id } = await createTemplate({
			data: {
				projectId,
				name: newName.trim(),
				state: defaultPosterState(),
			},
		});
		setNewName("");
		setCreating(false);
		await invalidateTemplates();
		router.navigate({
			to: "/story/$projectId/$templateId",
			params: { projectId, templateId: id },
		});
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this template?")) return;
		await deleteTemplate({ data: { id } });
		await invalidateTemplates();
	};

	const startRenameTemplate = (id: string, currentName: string) => {
		setEditingTemplateId(id);
		setTemplateDraft(currentName);
	};

	const commitRenameTemplate = async (id: string, currentName: string) => {
		const next = templateDraft.trim();
		setEditingTemplateId(null);
		if (!next || next === currentName) return;
		await renameTemplate({ data: { id, name: next } });
		await invalidateTemplates();
		await queryClient.invalidateQueries({ queryKey: ["template", id] });
	};

	const cancelRenameTemplate = () => {
		setEditingTemplateId(null);
		setTemplateDraft("");
	};

	const startRenameProject = () => {
		setEditingProject(true);
		setProjectDraft(project.name);
	};

	const commitRenameProject = async () => {
		const next = projectDraft.trim();
		setEditingProject(false);
		if (!next || next === project.name) return;
		await renameProject({ data: { id: projectId, name: next } });
		await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
		await queryClient.invalidateQueries({ queryKey: ["projects"] });
	};

	const cancelRenameProject = () => {
		setEditingProject(false);
		setProjectDraft("");
	};

	return (
		<div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
			<nav className="mb-2 text-xs text-ink-400">
				<Link to="/story" className="hover:text-ink-100">
					Projects
				</Link>
				<span className="mx-2">/</span>
				<span>{project.name}</span>
			</nav>
			<header className="mb-6 flex items-center justify-between gap-3">
				<div className="group flex items-center gap-2">
					{editingProject ? (
						<input
							autoFocus
							value={projectDraft}
							onChange={(e) => setProjectDraft(e.target.value)}
							onBlur={commitRenameProject}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									commitRenameProject();
								} else if (e.key === "Escape") {
									e.preventDefault();
									cancelRenameProject();
								}
							}}
							className="rounded border border-ink-600 bg-ink-900 px-2 py-1 text-lg font-semibold text-ink-50 focus:border-accent focus:outline-none"
						/>
					) : (
						<>
							<h1 className="text-lg font-semibold text-ink-50">{project.name}</h1>
							<button
								type="button"
								onClick={startRenameProject}
								aria-label="Rename project"
								className="rounded border border-transparent p-1 text-ink-400 opacity-0 hover:border-ink-500 hover:text-ink-100 group-hover:opacity-100"
							>
								<Pencil size={12} />
							</button>
						</>
					)}
				</div>
				{creating ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleCreate();
						}}
						className="flex gap-2"
					>
						<input
							autoFocus
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Template name"
							className="rounded border border-ink-600 bg-ink-900 px-2 py-1 text-sm text-ink-100 focus:border-accent focus:outline-none"
						/>
						<button
							type="submit"
							className="rounded bg-accent px-3 py-1 text-sm font-medium text-ink-950 hover:bg-accent-hover"
						>
							Create
						</button>
						<button
							type="button"
							onClick={() => {
								setCreating(false);
								setNewName("");
							}}
							className="rounded px-2 py-1 text-sm text-ink-300 hover:text-ink-100"
						>
							Cancel
						</button>
					</form>
				) : (
					<button
						type="button"
						onClick={() => setCreating(true)}
						className="flex items-center gap-1 rounded bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-accent-hover"
					>
						<Plus size={14} /> New template
					</button>
				)}
			</header>

			{templates.length === 0 ? (
				<p className="text-sm text-ink-300">No templates in this project yet.</p>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{templates.map((t) => {
						const editing = editingTemplateId === t.id;
						const updatedLabel = `Updated ${new Date(t.updatedAt).toLocaleDateString()}`;
						return (
							<li key={t.id} className="group relative">
								{editing ? (
									<div className="flex h-32 flex-col justify-between rounded border border-accent bg-ink-900 p-4">
										<input
											autoFocus
											value={templateDraft}
											onChange={(e) => setTemplateDraft(e.target.value)}
											onBlur={() => commitRenameTemplate(t.id, t.name)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													commitRenameTemplate(t.id, t.name);
												} else if (e.key === "Escape") {
													e.preventDefault();
													cancelRenameTemplate();
												}
											}}
											className="w-full rounded border border-ink-600 bg-ink-950 px-2 py-1 text-sm font-medium text-ink-50 focus:border-accent focus:outline-none"
										/>
										<span className="text-xs text-ink-400">{updatedLabel}</span>
									</div>
								) : (
									<Link
										to="/story/$projectId/$templateId"
										params={{ projectId, templateId: t.id }}
										className="flex h-32 flex-col justify-between rounded border border-ink-700 bg-ink-900 p-4 text-left transition-colors hover:border-ink-500"
									>
										<span className="font-medium text-ink-50">{t.name}</span>
										<span className="text-xs text-ink-400">{updatedLabel}</span>
									</Link>
								)}
								{!editing ? (
									<div className="absolute top-2 right-2 hidden gap-1 group-hover:flex">
										<button
											type="button"
											onClick={() => startRenameTemplate(t.id, t.name)}
											aria-label="Rename template"
											className="rounded border border-ink-700 bg-ink-950/80 p-1 text-ink-400 hover:border-ink-500 hover:text-ink-100"
										>
											<Pencil size={12} />
										</button>
										<button
											type="button"
											onClick={() => handleDelete(t.id)}
											aria-label="Delete template"
											className="rounded border border-ink-700 bg-ink-950/80 p-1 text-ink-400 hover:border-red-500 hover:text-red-400"
										>
											<Trash2 size={12} />
										</button>
									</div>
								) : null}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
