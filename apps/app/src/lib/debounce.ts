import { useEffect, useRef } from "react";

export function useDebouncedEffect(
	effect: () => void | (() => void),
	deps: React.DependencyList,
	delayMs: number,
) {
	const firstRun = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: deps are forwarded
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
			return;
		}
		const h = setTimeout(effect, delayMs);
		return () => clearTimeout(h);
	}, [...deps, delayMs]);
}
