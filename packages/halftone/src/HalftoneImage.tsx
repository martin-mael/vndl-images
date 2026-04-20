import { forwardRef, useCallback, useEffect, useRef } from "react";

// ─── IDB persistence ────────────────────────────────────────────────────────

const DB_NAME = "halftone";
const DB_VERSION = 1;
const STORE = "tiles";

let _db: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
	if (_db) return _db;
	_db = new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	return _db;
}

async function idbGet(key: string): Promise<Uint8ClampedArray | undefined> {
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
			req.onsuccess = () => resolve(req.result as Uint8ClampedArray | undefined);
			req.onerror = () => reject(req.error);
		});
	} catch {
		return undefined;
	}
}

function idbSet(key: string, data: Uint8ClampedArray): void {
	openDb()
		.then(
			(db) =>
				new Promise<void>((resolve, reject) => {
					const req = db
						.transaction(STORE, "readwrite")
						.objectStore(STORE)
						.put(data, key);
					req.onsuccess = () => resolve();
					req.onerror = () => reject(req.error);
				}),
		)
		.catch(() => {});
}

// ─── In-memory L1 cache (session-scoped) ────────────────────────────────────

const memCache = new Map<string, Uint8ClampedArray>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveColor(color: string): string {
	if (color.startsWith("var(")) {
		const name = color.slice(4, -1).trim();
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	}
	if (color.startsWith("--")) {
		return getComputedStyle(document.documentElement).getPropertyValue(color).trim();
	}
	return color;
}

function hexToRgb(hex: string): [number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return [0, 0, 0];
	return [
		Number.parseInt(result[1], 16),
		Number.parseInt(result[2], 16),
		Number.parseInt(result[3], 16),
	];
}

function cacheKey(
	src: string,
	w: number,
	h: number,
	dark: string,
	light: string,
	cellW: number,
	cellH: number,
	gamma: number,
): string {
	return `${src}|${w}x${h}|${dark}|${light}|${cellW}|${cellH}|${gamma}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface HalftoneImageProps {
	src: string;
	darkColor?: string;
	lightColor?: string;
	className?: string;
	crossOrigin?: "anonymous" | "use-credentials";
	cellW?: number;
	cellH?: number;
	gamma?: number;
	onReady?: () => void;
}

export const HalftoneImage = forwardRef<HTMLCanvasElement, HalftoneImageProps>(
	function HalftoneImage(
		{
			src,
			darkColor = "#082463",
			lightColor = "#39a2ff",
			className,
			crossOrigin,
			cellW = 16,
			cellH = 8,
			gamma = 0.8,
			onReady,
		},
		forwardedRef,
	) {
		const localRef = useRef<HTMLCanvasElement>(null);
		const onReadyRef = useRef(onReady);
		useEffect(() => {
			onReadyRef.current = onReady;
		});

		const setRef = useCallback(
			(node: HTMLCanvasElement | null) => {
				(localRef as React.RefObject<HTMLCanvasElement | null>).current = node;
				if (typeof forwardedRef === "function") forwardedRef(node);
				else if (forwardedRef)
					(forwardedRef as React.RefObject<HTMLCanvasElement | null>).current = node;
			},
			[forwardedRef],
		);

		useEffect(() => {
			const canvas = localRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			const resolvedDark = resolveColor(darkColor);
			const resolvedLight = resolveColor(lightColor);
			const [dr, dg, db] = hexToRgb(resolvedDark);
			const [lr, lg, lb] = hexToRgb(resolvedLight);

			let worker: Worker | null = null;
			let aborted = false;

			function paint(w: number, h: number, data: Uint8ClampedArray) {
				if (aborted) return;
				canvas!.width = w;
				canvas!.height = h;
				ctx!.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
				onReadyRef.current?.();
			}

			const img = new Image();
			if (crossOrigin) img.crossOrigin = crossOrigin;

			img.onload = async () => {
				if (aborted) return;

				const dpr = window.devicePixelRatio ?? 1;
				const renderW = canvas.clientWidth > 0 ? canvas.clientWidth * dpr : 1920;
				const scale = Math.min(1, renderW / img.naturalWidth);
				const w = Math.max(1, Math.round(img.naturalWidth * scale));
				const h = Math.max(1, Math.round(img.naturalHeight * scale));

				canvas.width = w;
				canvas.height = h;
				ctx.fillStyle = `rgb(${dr} ${dg} ${db})`;
				ctx.fillRect(0, 0, w, h);

				const key = cacheKey(src, w, h, resolvedDark, resolvedLight, cellW, cellH, gamma);

				const mem = memCache.get(key);
				if (mem) {
					paint(w, h, mem);
					return;
				}

				const persisted = await idbGet(key);
				if (aborted) return;
				if (persisted) {
					memCache.set(key, persisted);
					paint(w, h, persisted);
					return;
				}

				const offscreen = new OffscreenCanvas(w, h);
				const offCtx = offscreen.getContext("2d");
				if (!offCtx || aborted) return;
				offCtx.drawImage(img, 0, 0, w, h);
				const pixels = offCtx.getImageData(0, 0, w, h).data;

				worker = new Worker(new URL("./halftone.worker.ts", import.meta.url), {
					type: "module",
				});

				worker.onmessage = ({ data: out }: MessageEvent<Uint8ClampedArray>) => {
					memCache.set(key, out);
					idbSet(key, out);
					paint(w, h, out);
					worker?.terminate();
					worker = null;
				};

				worker.postMessage(
					{ pixels, w, h, dr, dg, db, lr, lg, lb, cellW, cellH, gamma },
					[pixels.buffer],
				);
			};

			img.src = src;

			return () => {
				aborted = true;
				worker?.terminate();
			};
		}, [src, darkColor, lightColor, crossOrigin, cellW, cellH, gamma]);

		return <canvas ref={setRef} className={className} />;
	},
);
