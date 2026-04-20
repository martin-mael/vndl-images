import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Vandale Radio Images" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,900;1,900&display=swap",
			},
		],
	}),
	component: RootLayout,
	shellComponent: RootDocument,
});

function RootLayout() {
	return (
		<div className="flex h-dvh flex-col bg-ink-950 text-ink-50 font-mono">
			<nav className="flex shrink-0 items-center gap-1 border-b border-ink-700 px-4 py-2 text-xs uppercase tracking-widest">
				<span className="mr-3 text-ink-300">Vandale</span>
				<Link
					to="/"
					className="rounded px-2 py-1 text-ink-300 hover:text-ink-50"
					activeProps={{ className: "rounded px-2 py-1 text-ink-50 bg-ink-800" }}
					activeOptions={{ exact: true }}
				>
					Simple
				</Link>
				<Link
					to="/story"
					className="rounded px-2 py-1 text-ink-300 hover:text-ink-50"
					activeProps={{ className: "rounded px-2 py-1 text-ink-50 bg-ink-800" }}
				>
					Stories
				</Link>
			</nav>
			<div className="min-h-0 flex-1">
				<Outlet />
			</div>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
