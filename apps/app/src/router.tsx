import { QueryClient } from "@tanstack/react-query";
import { Link, createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
			},
		},
	});

	const router = createRouter({
		routeTree,
		context: { queryClient },
		defaultPreload: "intent",
		defaultPreloadStaleTime: 30_000,
		defaultStaleTime: 10_000,
		defaultNotFoundComponent: NotFound,
	});

	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
};

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
