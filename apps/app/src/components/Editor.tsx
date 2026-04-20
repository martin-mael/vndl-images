import { HalftoneImage } from "@vandale/halftone";
import { Download, ImageIcon, Loader2 } from "lucide-react";
import { ZoomableView } from "./ZoomableView";
import { useCallback, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { ColorPicker } from "./ui/ColorPicker";
import { Slider } from "./ui/Slider";
import { ImageDrop } from "./ui/ImageDrop";
import { uploadImage } from "@/lib/upload";
import { useDebouncedEffect } from "@/lib/debounce";
import { saveSimpleState, type SimpleState } from "@/server/fn/simpleState";

const route = getRouteApi("/");

export function Editor() {
	const initial = route.useLoaderData() as SimpleState;

	const [src, setSrc] = useState<string | null>(initial.imageUrl);
	const [darkColor, setDarkColor] = useState(initial.darkColor);
	const [lightColor, setLightColor] = useState(initial.lightColor);
	const [cellW, setCellW] = useState(initial.cellW);
	const [cellH, setCellH] = useState(initial.cellH);
	const [gamma, setGamma] = useState(initial.gamma);
	const [rotation, setRotation] = useState(initial.rotation);
	const [isReady, setIsReady] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const loadFile = useCallback(
		async (file: File) => {
			setUploading(true);
			setIsReady(false);
			try {
				const url = await uploadImage(file, src);
				setSrc(url);
			} catch (e) {
				console.error(e);
			} finally {
				setUploading(false);
			}
		},
		[src],
	);

	const handleDownload = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const a = document.createElement("a");
		a.download = "halftone.png";
		a.href = canvas.toDataURL("image/png");
		a.click();
	}, []);

	const resetReady = useCallback(() => setIsReady(false), []);

	useDebouncedEffect(
		() => {
			setSaveState("saving");
			saveSimpleState({
				data: {
					imageUrl: src,
					darkColor,
					lightColor,
					cellW,
					cellH,
					gamma,
					rotation,
				},
			})
				.then(() => setSaveState("saved"))
				.catch(() => setSaveState("idle"));
		},
		[src, darkColor, lightColor, cellW, cellH, gamma, rotation],
		500,
	);

	return (
		<div className="flex h-full flex-col md:flex-row overflow-hidden">
			<aside className="order-last md:order-first flex flex-1 md:flex-none md:w-72 md:shrink-0 flex-col gap-4 md:gap-6 border-t border-ink-700 md:border-t-0 md:border-r p-4 md:p-5 overflow-y-auto overflow-x-hidden">
				<header className="flex items-center justify-between">
					<span className="text-xs text-ink-300 tracking-widest uppercase">Simple Halftone</span>
					<SaveIndicator state={saveState} />
				</header>

				<section>
					<ImageDrop hasImage={!!src} onFile={loadFile} />
					{uploading ? (
						<div className="mt-2 flex items-center gap-2 text-xs text-ink-300">
							<Loader2 size={12} className="animate-spin" /> Uploading…
						</div>
					) : null}
				</section>

				<section className="flex flex-col gap-3">
					<label className="text-xs text-ink-300 uppercase tracking-widest">Colors</label>
					<div className="flex gap-3">
						<ColorPicker
							label="Dark"
							value={darkColor}
							onChange={(v) => {
								setDarkColor(v);
								resetReady();
							}}
						/>
						<ColorPicker
							label="Light"
							value={lightColor}
							onChange={(v) => {
								setLightColor(v);
								resetReady();
							}}
						/>
					</div>
				</section>

				<section className="flex flex-col gap-4">
					<label className="text-xs text-ink-300 uppercase tracking-widest">Parameters</label>
					<Slider
						label="Cell Width"
						value={cellW}
						min={2}
						max={64}
						step={1}
						format={(v) => String(v)}
						onChange={(v) => {
							setCellW(v);
							resetReady();
						}}
					/>
					<Slider
						label="Cell Height"
						value={cellH}
						min={1}
						max={64}
						step={1}
						format={(v) => String(v)}
						onChange={(v) => {
							setCellH(v);
							resetReady();
						}}
					/>
					<Slider
						label="Gamma"
						value={gamma}
						min={0.1}
						max={3}
						step={0.05}
						format={(v) => v.toFixed(2)}
						onChange={(v) => {
							setGamma(v);
							resetReady();
						}}
					/>
					<Slider
						label="Rotation"
						value={rotation}
						min={0}
						max={360}
						step={1}
						format={(v) => `${v}°`}
						onChange={(v) => {
							setRotation(v);
							resetReady();
						}}
					/>
				</section>

				<div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-2 bg-ink-950 md:static md:mx-0 md:px-0 md:pb-0 md:pt-0 mt-auto">
					<button
						type="button"
						disabled={!src || !isReady}
						onClick={handleDownload}
						className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
					>
						<Download size={16} />
						Download PNG
					</button>
				</div>
			</aside>

			<main className="order-first md:order-last h-[45vh] md:h-auto md:flex-1">
				{src ? (
					<ZoomableView className="h-full w-full">
						<HalftoneImage
							ref={canvasRef}
							src={src}
							crossOrigin="anonymous"
							darkColor={darkColor}
							lightColor={lightColor}
							cellW={cellW}
							cellH={cellH}
							gamma={gamma}
							outputWidth={2160}
							rotation={rotation}
							onReady={() => setIsReady(true)}
							className="max-h-full max-w-full object-contain"
						/>
					</ZoomableView>
				) : (
					<div className="flex h-full items-center justify-center p-4 md:p-6">
						<div className="flex flex-col items-center gap-3 text-ink-600">
							<ImageIcon size={48} strokeWidth={1} />
							<span className="text-sm">Upload an image to get started</span>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" }) {
	if (state === "idle") return null;
	return (
		<span className="flex items-center gap-1 text-[10px] normal-case text-ink-400">
			{state === "saving" ? (
				<>
					<Loader2 size={10} className="animate-spin" /> Saving
				</>
			) : (
				<>Saved</>
			)}
		</span>
	);
}
