import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/sign-in")({
	component: SignInPage,
});

function SignInPage() {
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGoogle = async () => {
		setPending(true);
		setError(null);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/",
				errorCallbackURL: "/sign-in?error=1",
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Sign-in failed");
			setPending(false);
		}
	};

	const queryError = new URLSearchParams(
		typeof window !== "undefined" ? window.location.search : "",
	).get("error");

	return (
		<div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-ink-50">
			<div className="flex flex-col items-center gap-2 text-center">
				<span className="text-xs text-ink-300 tracking-widest uppercase">
					Vandale Radio Images
				</span>
				<h1 className="text-2xl font-semibold">Sign in</h1>
				<p className="max-w-sm text-sm text-ink-300">
					Use your <span className="text-ink-100">@vandaleradio.org</span> Google account.
				</p>
			</div>
			<button
				type="button"
				onClick={handleGoogle}
				disabled={pending}
				className="flex items-center justify-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-accent-hover disabled:opacity-30"
			>
				{pending ? "Redirecting…" : "Continue with Google"}
			</button>
			{(error || queryError) && (
				<p className="text-sm text-red-400">
					{error ?? "Sign-in was rejected. Only @vandaleradio.org accounts are allowed."}
				</p>
			)}
			<button
				type="button"
				onClick={() => router.history.back()}
				className="text-xs text-ink-400 hover:text-ink-200"
			>
				Go back
			</button>
		</div>
	);
}
