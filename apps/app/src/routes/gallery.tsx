import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { deleteExport, listExports } from "@/server/fn/exports";

export const Route = createFileRoute("/gallery")({
	component: GalleryPage,
	loader: () => listExports({ data: {} }),
});

function GalleryPage() {
	const exports = Route.useLoaderData();
	const router = useRouter();
	const { data: session } = useSession();

	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			await deleteExport({ data: { id } });
			await router.invalidate();
		} finally {
			setDeletingId(null);
		}
	};

	const grouped = groupByProject(exports);

	return (
		<div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
			<header className="mb-6">
				<h1 className="text-lg font-semibold text-ink-50">Gallery</h1>
				<p className="text-xs text-ink-400">Shared exports, newest first, grouped by project.</p>
			</header>

			{exports.length === 0 ? (
				<p className="text-sm text-ink-300">
					No exports yet. Open a{" "}
					<Link to="/story" className="text-accent">
						story
					</Link>{" "}
					and hit download.
				</p>
			) : (
				<div className="flex flex-col gap-8">
					{grouped.map((group) => (
						<section key={group.projectId} className="flex flex-col gap-3">
							<header className="flex items-baseline justify-between">
								{group.projectId ? (
									<Link
										to="/story/$projectId"
										params={{ projectId: group.projectId }}
										className="text-sm font-medium text-ink-50 hover:text-accent"
									>
										{group.projectName ?? "Untitled project"}
									</Link>
								) : (
									<span className="text-sm font-medium text-ink-400">Unclassified</span>
								)}
								<span className="text-xs text-ink-400">{group.items.length} export(s)</span>
							</header>
							<ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
								{group.items.map((e) => {
									const isDeleting = deletingId === e.id;
									return (
										<li
											key={e.id}
											className={`group relative transition-opacity ${
												isDeleting ? "pointer-events-none opacity-40" : ""
											}`}
										>
											<a
												href={e.pngUrl}
												target="_blank"
												rel="noreferrer"
												className="block overflow-hidden rounded border border-ink-700 bg-ink-900 transition-colors hover:border-ink-500"
											>
												<img
													src={e.pngUrl}
													alt={e.title}
													loading="lazy"
													className="aspect-[9/16] w-full object-cover"
												/>
											</a>
											<div className="mt-1 flex flex-col gap-0.5 text-[10px] text-ink-400">
												<span className="truncate text-ink-200">{e.title}</span>
												<span className="truncate">
													{e.createdByName ?? e.createdByEmail ?? ""} ·{" "}
													{new Date(e.createdAt).toLocaleDateString()}
												</span>
											</div>
											<div
												className={`absolute top-1 right-1 gap-1 ${
													isDeleting ? "flex" : "hidden group-hover:flex"
												}`}
											>
												<a
													href={e.pngUrl}
													download
													className="rounded border border-ink-700 bg-ink-950/80 p-1 text-ink-200 hover:border-ink-500"
													aria-label="Download"
												>
													<Download size={12} />
												</a>
												{session?.user.id === e.createdById ? (
													<button
														type="button"
														disabled={isDeleting}
														onClick={() => handleDelete(e.id)}
														aria-label="Delete"
														className="rounded border border-ink-700 bg-ink-950/80 p-1 text-ink-200 hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed"
													>
														{isDeleting ? (
															<Loader2 size={12} className="animate-spin" />
														) : (
															<Trash2 size={12} />
														)}
													</button>
												) : null}
											</div>
										</li>
									);
								})}
							</ul>
						</section>
					))}
				</div>
			)}
		</div>
	);
}

type ExportRow = Awaited<ReturnType<typeof listExports>>[number];

function groupByProject(rows: ExportRow[]) {
	const map = new Map<
		string,
		{ projectId: string | null; projectName: string | null; items: ExportRow[] }
	>();
	for (const row of rows) {
		const key = row.projectId ?? "__none__";
		const existing = map.get(key);
		if (existing) {
			existing.items.push(row);
		} else {
			map.set(key, {
				projectId: row.projectId,
				projectName: row.projectName,
				items: [row],
			});
		}
	}
	return Array.from(map.values());
}
