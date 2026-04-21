import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { projectsQueryOptions } from "@/lib/queries";
import { createProject, deleteProject, renameProject } from "@/server/fn/projects";

export const Route = createFileRoute("/story/")({
	component: ProjectsPage,
	loader: ({ context }) => context.queryClient.ensureQueryData(projectsQueryOptions()),
});

function ProjectsPage() {
	const { data: projects } = useSuspenseQuery(projectsQueryOptions());
	const queryClient = useQueryClient();
	const router = useRouter();
	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");

	const handleCreate = async () => {
		if (!newName.trim()) return;
		const { id } = await createProject({ data: { name: newName.trim() } });
		setNewName("");
		setCreating(false);
		await queryClient.invalidateQueries({ queryKey: ["projects"] });
		router.navigate({ to: "/story/$projectId", params: { projectId: id } });
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this project? Templates and exports will be gone.")) return;
		await deleteProject({ data: { id } });
		await queryClient.invalidateQueries({ queryKey: ["projects"] });
	};

	const startRename = (id: string, currentName: string) => {
		setEditingId(id);
		setEditingName(currentName);
	};

	const commitRename = async (id: string, currentName: string) => {
		const next = editingName.trim();
		setEditingId(null);
		if (!next || next === currentName) return;
		await renameProject({ data: { id, name: next } });
		await queryClient.invalidateQueries({ queryKey: ["projects"] });
		await queryClient.invalidateQueries({ queryKey: ["project", id] });
	};

	const cancelRename = () => {
		setEditingId(null);
		setEditingName("");
	};

	return (
		<div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
			<header className="mb-6 flex items-center justify-between gap-3">
				<h1 className="text-lg font-semibold text-ink-50">Projects</h1>
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
							placeholder="Project name"
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
						<Plus size={14} /> New project
					</button>
				)}
			</header>

			{projects.length === 0 ? (
				<p className="text-sm text-ink-300">No projects yet. Create one to get started.</p>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{projects.map((p) => {
						const editing = editingId === p.id;
						const updatedLabel = `Updated ${new Date(p.updatedAt).toLocaleDateString()}`;
						return (
							<li key={p.id} className="group relative">
								{editing ? (
									<div className="flex h-32 flex-col justify-between rounded border border-accent bg-ink-900 p-4">
										<input
											autoFocus
											value={editingName}
											onChange={(e) => setEditingName(e.target.value)}
											onBlur={() => commitRename(p.id, p.name)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													commitRename(p.id, p.name);
												} else if (e.key === "Escape") {
													e.preventDefault();
													cancelRename();
												}
											}}
											className="w-full rounded border border-ink-600 bg-ink-950 px-2 py-1 text-sm font-medium text-ink-50 focus:border-accent focus:outline-none"
										/>
										<span className="text-xs text-ink-400">{updatedLabel}</span>
									</div>
								) : (
									<Link
										to="/story/$projectId"
										params={{ projectId: p.id }}
										className="flex h-32 flex-col justify-between rounded border border-ink-700 bg-ink-900 p-4 text-left transition-colors hover:border-ink-500"
									>
										<span className="font-medium text-ink-50">{p.name}</span>
										<span className="text-xs text-ink-400">{updatedLabel}</span>
									</Link>
								)}
								{!editing ? (
									<div className="absolute top-2 right-2 hidden gap-1 group-hover:flex">
										<button
											type="button"
											onClick={() => startRename(p.id, p.name)}
											aria-label="Rename project"
											className="rounded border border-ink-700 bg-ink-950/80 p-1 text-ink-400 hover:border-ink-500 hover:text-ink-100"
										>
											<Pencil size={12} />
										</button>
										<button
											type="button"
											onClick={() => handleDelete(p.id)}
											aria-label="Delete project"
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
