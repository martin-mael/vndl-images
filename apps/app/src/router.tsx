import { Link, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () =>
	createRouter({
		routeTree,
		defaultPreload: "intent",
		defaultNotFoundComponent: NotFound,
	});

function NotFound() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center font-mono">
			<p className="text-xs uppercase tracking-widest text-ink-400">404</p>
			<p className="text-sm text-ink-100">This page doesn't exist.</p>
			<Link to="/" className="text-xs uppercase tracking-widest text-ink-300 underline hover:text-ink-50">
				Back to home
			</Link>
		</div>
	);
}
