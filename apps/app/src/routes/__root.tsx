import type { QueryClient } from "@tanstack/react-query";
import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import appCss from "../styles.css?url";
import { getServerSession } from "@/server/session";
import { signOut, useSession } from "@/lib/auth-client";

const PUBLIC_PATHS = new Set(["/sign-in"]);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
	beforeLoad: async ({ location }) => {
		if (PUBLIC_PATHS.has(location.pathname) || location.pathname.startsWith("/api/")) {
			return { session: null };
		}
		// Only hit the server during SSR. On client-side navigation we trust the
		// cookie (server fns will 401 on expiry, and useSession() refreshes live).
		if (typeof window !== "undefined") {
			return { session: undefined };
		}
		const session = await getServerSession();
		if (!session) {
			throw redirect({ to: "/sign-in" });
		}
		return { session };
	},
	component: RootLayout,
	shellComponent: RootDocument,
});

function RootLayout() {
	const { session: ssrSession } = Route.useRouteContext();
	const { data: liveSession } = useSession();
	const showNav = ssrSession !== null || !!liveSession;
	return (
		<div className="flex h-full flex-col bg-ink-950 text-ink-50 font-mono">
			{showNav ? <TopNav /> : null}
			<div className="min-h-0 flex-1">
				<Outlet />
			</div>
		</div>
	);
}

function TopNav() {
	const { data: liveSession } = useSession();
	const router = useRouter();

	const handleSignOut = async () => {
		await signOut();
		router.invalidate();
		router.navigate({ to: "/sign-in" });
	};

	return (
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
			<Link
				to="/gallery"
				className="rounded px-2 py-1 text-ink-300 hover:text-ink-50"
				activeProps={{ className: "rounded px-2 py-1 text-ink-50 bg-ink-800" }}
			>
				Gallery
			</Link>
			<div className="ml-auto flex items-center gap-3">
				<span className="normal-case text-ink-300">
					{liveSession?.user.email ?? liveSession?.user.name ?? ""}
				</span>
				<button
					type="button"
					onClick={handleSignOut}
					aria-label="Sign out"
					className="flex items-center gap-1 rounded px-2 py-1 text-ink-400 hover:text-ink-100"
				>
					<LogOut size={12} />
				</button>
			</div>
		</nav>
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
