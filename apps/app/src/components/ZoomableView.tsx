import { useEffect, useRef } from "react";

interface Transform {
	scale: number;
	tx: number;
	ty: number;
}

interface ZoomableViewProps {
	children: React.ReactNode;
	className?: string;
}

export function ZoomableView({ children, className }: ZoomableViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const stateRef = useRef<Transform>({ scale: 1, tx: 0, ty: 0 });
	const lastTapRef = useRef(0);

	type Gesture =
		| { type: "pinch"; dist: number; midX: number; midY: number }
		| { type: "pan"; x: number; y: number };
	const gestureRef = useRef<Gesture | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		const inner = innerRef.current;
		if (!el || !inner) return;

		function applyTransform(t: Transform, animated = false) {
			inner!.style.transition = animated ? "transform 0.25s ease" : "none";
			inner!.style.transform = `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;
			if (animated) setTimeout(() => (inner!.style.transition = "none"), 250);
		}

		function onTouchStart(e: TouchEvent) {
			if (e.touches.length === 2) {
				e.preventDefault();
				const [a, b] = [e.touches[0], e.touches[1]];
				gestureRef.current = {
					type: "pinch",
					dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
					midX: (a.clientX + b.clientX) / 2,
					midY: (a.clientY + b.clientY) / 2,
				};
			} else if (e.touches.length === 1) {
				const now = Date.now();
				if (now - lastTapRef.current < 280) {
					stateRef.current = { scale: 1, tx: 0, ty: 0 };
					applyTransform(stateRef.current, true);
				}
				lastTapRef.current = now;
				gestureRef.current = { type: "pan", x: e.touches[0].clientX, y: e.touches[0].clientY };
			}
		}

		function onTouchMove(e: TouchEvent) {
			e.preventDefault();
			const g = gestureRef.current;
			if (!g) return;
			const { scale, tx, ty } = stateRef.current;

			if (e.touches.length === 2 && g.type === "pinch") {
				const [a, b] = [e.touches[0], e.touches[1]];
				const currDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
				const currMidX = (a.clientX + b.clientX) / 2;
				const currMidY = (a.clientY + b.clientY) / 2;

				const rawScale = scale * (currDist / g.dist);
				const newScale = Math.min(Math.max(rawScale, 0.5), 10);
				const r = newScale / scale;
				const dPanX = currMidX - g.midX;
				const dPanY = currMidY - g.midY;

				stateRef.current = {
					scale: newScale,
					tx: tx * r + g.midX * (1 - r) + dPanX,
					ty: ty * r + g.midY * (1 - r) + dPanY,
				};
				gestureRef.current = { type: "pinch", dist: currDist, midX: currMidX, midY: currMidY };
			} else if (e.touches.length === 1 && g.type === "pan") {
				stateRef.current = {
					scale,
					tx: tx + e.touches[0].clientX - g.x,
					ty: ty + e.touches[0].clientY - g.y,
				};
				gestureRef.current = { type: "pan", x: e.touches[0].clientX, y: e.touches[0].clientY };
			}
			applyTransform(stateRef.current);
		}

		function onTouchEnd(e: TouchEvent) {
			if (e.touches.length === 0) {
				gestureRef.current = null;
			} else if (e.touches.length === 1) {
				gestureRef.current = { type: "pan", x: e.touches[0].clientX, y: e.touches[0].clientY };
			}
		}

		el.addEventListener("touchstart", onTouchStart, { passive: false });
		el.addEventListener("touchmove", onTouchMove, { passive: false });
		el.addEventListener("touchend", onTouchEnd, { passive: true });

		return () => {
			el.removeEventListener("touchstart", onTouchStart);
			el.removeEventListener("touchmove", onTouchMove);
			el.removeEventListener("touchend", onTouchEnd);
		};
	}, []);

	return (
		<div ref={containerRef} className={`touch-none overflow-hidden ${className ?? ""}`}>
			<div
				ref={innerRef}
				style={{ transformOrigin: "0 0", willChange: "transform" }}
				className="flex h-full w-full items-center justify-center"
			>
				{children}
			</div>
		</div>
	);
}
