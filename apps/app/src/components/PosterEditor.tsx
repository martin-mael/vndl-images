import { HalftoneImage } from "@vandale/halftone";
import { Download } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import logoUrl from "@/assets/logo_vndl.svg?url";
import { ColorPicker } from "./ui/ColorPicker";
import { Slider } from "./ui/Slider";
import { ImageDrop } from "./ui/ImageDrop";
import { downloadPoster } from "./poster/exportPoster";
import { LAYOUT, POSTER_H, POSTER_W } from "./poster/layout";
import {
	type HalftoneParams,
	type ImageSlot,
	type PosterColors,
	defaultHalftone,
} from "./poster/types";

const FONT_FAMILY = '"Rubik", sans-serif';

function makeSlot(dark: string, light: string, override: Partial<HalftoneParams> = {}): ImageSlot {
	return { src: null, params: { ...defaultHalftone, ...override }, dark, light };
}

export function PosterEditor() {
	const [background, setBackground] = useState<ImageSlot>(() =>
		makeSlot("#0a1f2e", "#8be3c3"),
	);
	const [frameImg, setFrameImg] = useState<ImageSlot>(() =>
		makeSlot("#0a1f2e", "#8be3c3"),
	);
	const [textBlockImg, setTextBlockImg] = useState<ImageSlot>(() =>
		makeSlot("#0a1e1a", "#0a1e1a"),
	);

	const [title, setTitle] = useState("AQUAPLANING");
	const [issue, setIssue] = useState("N°14");
	const [day, setDay] = useState("LUNDI");
	const [timeStart, setTimeStart] = useState("20:00");
	const [timeEnd, setTimeEnd] = useState("22:30");
	const [topText, setTopText] = useState(
		"Environ 2h30 de pure nostalgie avec Maya ce soir.",
	);
	const [bottomText, setBottomText] = useState(
		"Musiques de jeux vidéos et souvenirs.",
	);
	const [colors, setColors] = useState<PosterColors>({
		posterBackground: "#0a1f2e",
		textColor: "#8be3c3",
		arrowColor: "#8be3c3",
	});

	const [bgReady, setBgReady] = useState(false);
	const [frameReady, setFrameReady] = useState(false);
	const [textReady, setTextReady] = useState(false);
	const bgCanvasRef = useRef<HTMLCanvasElement>(null);
	const frameCanvasRef = useRef<HTMLCanvasElement>(null);
	const textCanvasRef = useRef<HTMLCanvasElement>(null);
	const previewWrapRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useLayoutEffect(() => {
		const wrap = previewWrapRef.current;
		if (!wrap) return;
		const measure = () => {
			const { clientWidth, clientHeight } = wrap;
			const s = Math.min(clientWidth / POSTER_W, clientHeight / POSTER_H);
			setScale(s > 0 ? s : 1);
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, []);

	const makeLoader = useCallback(
		(setter: React.Dispatch<React.SetStateAction<ImageSlot>>, readySetter: (v: boolean) => void) =>
			(file: File) => {
				setter((prev) => {
					if (prev.src) URL.revokeObjectURL(prev.src);
					return { ...prev, src: URL.createObjectURL(file) };
				});
				readySetter(false);
			},
		[],
	);

	useEffect(() => {
		return () => {
			if (background.src) URL.revokeObjectURL(background.src);
			if (frameImg.src) URL.revokeObjectURL(frameImg.src);
			if (textBlockImg.src) URL.revokeObjectURL(textBlockImg.src);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const makeParamUpdater =
		(setter: React.Dispatch<React.SetStateAction<ImageSlot>>, readySetter: (v: boolean) => void) =>
		<K extends keyof HalftoneParams>(k: K, v: HalftoneParams[K]) => {
			setter((p) => ({ ...p, params: { ...p.params, [k]: v } }));
			readySetter(false);
		};

	const makeColorUpdater =
		(setter: React.Dispatch<React.SetStateAction<ImageSlot>>, readySetter: (v: boolean) => void) =>
		(key: "dark" | "light", v: string) => {
			setter((p) => ({ ...p, [key]: v }));
			readySetter(false);
		};

	const canDownload =
		(!background.src || bgReady) &&
		(!frameImg.src || frameReady) &&
		(!textBlockImg.src || textReady);

	const handleDownload = () => {
		downloadPoster({
			backgroundCanvas: background.src ? bgCanvasRef.current : null,
			frameCanvas: frameImg.src ? frameCanvasRef.current : null,
			textBlockCanvas: textBlockImg.src ? textCanvasRef.current : null,
			logoUrl,
			title,
			issue,
			day,
			timeStart,
			timeEnd,
			topText,
			bottomText,
			colors,
		});
	};

	return (
		<div className="flex h-full flex-col md:flex-row overflow-hidden">
			<aside className="order-last md:order-first flex flex-1 md:flex-none md:w-80 md:shrink-0 flex-col gap-5 border-t border-ink-700 md:border-t-0 md:border-r p-4 md:p-5 overflow-y-auto overflow-x-hidden">
				<header>
					<span className="text-xs text-ink-300 tracking-widest uppercase">
						Story Composer
					</span>
				</header>

				<ImageSection
					label="Background"
					slot={background}
					onFile={makeLoader(setBackground, setBgReady)}
					onParam={makeParamUpdater(setBackground, setBgReady)}
					onColor={makeColorUpdater(setBackground, setBgReady)}
				/>
				<ImageSection
					label="Frame"
					slot={frameImg}
					onFile={makeLoader(setFrameImg, setFrameReady)}
					onParam={makeParamUpdater(setFrameImg, setFrameReady)}
					onColor={makeColorUpdater(setFrameImg, setFrameReady)}
				/>
				<ImageSection
					label="Text block"
					slot={textBlockImg}
					onFile={makeLoader(setTextBlockImg, setTextReady)}
					onParam={makeParamUpdater(setTextBlockImg, setTextReady)}
					onColor={makeColorUpdater(setTextBlockImg, setTextReady)}
				/>

				<section className="flex flex-col gap-3">
					<span className="text-xs text-ink-300 uppercase tracking-widest">Header</span>
					<TextField label="Title" value={title} onChange={setTitle} />
					<TextField label="Issue" value={issue} onChange={setIssue} />
				</section>

				<section className="flex flex-col gap-3">
					<span className="text-xs text-ink-300 uppercase tracking-widest">Time column</span>
					<TextField label="Day" value={day} onChange={setDay} />
					<div className="flex gap-2">
						<TextField label="Start" value={timeStart} onChange={setTimeStart} />
						<TextField label="End" value={timeEnd} onChange={setTimeEnd} />
					</div>
				</section>

				<section className="flex flex-col gap-3">
					<span className="text-xs text-ink-300 uppercase tracking-widest">Text blocks</span>
					<TextArea label="Top" value={topText} onChange={setTopText} />
					<TextArea label="Bottom" value={bottomText} onChange={setBottomText} />
				</section>

				<section className="flex flex-col gap-3">
					<span className="text-xs text-ink-300 uppercase tracking-widest">
						Poster colors
					</span>
					<div className="flex gap-3">
						<ColorPicker
							label="Fill"
							value={colors.posterBackground}
							onChange={(v) => setColors((c) => ({ ...c, posterBackground: v }))}
						/>
						<ColorPicker
							label="Text"
							value={colors.textColor}
							onChange={(v) => setColors((c) => ({ ...c, textColor: v }))}
						/>
						<ColorPicker
							label="Arrow"
							value={colors.arrowColor}
							onChange={(v) => setColors((c) => ({ ...c, arrowColor: v }))}
						/>
					</div>
				</section>

				<div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-2 bg-ink-950 md:static md:mx-0 md:px-0 md:pb-0 md:pt-0 mt-auto">
					<button
						type="button"
						disabled={!canDownload}
						onClick={handleDownload}
						className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
					>
						<Download size={16} />
						Download PNG
					</button>
				</div>
			</aside>

			<main
				ref={previewWrapRef}
				className="order-first md:order-last h-[50vh] md:h-auto md:flex-1 flex items-center justify-center overflow-hidden p-4"
			>
				<div
					style={{
						width: POSTER_W,
						height: POSTER_H,
						transform: `scale(${scale})`,
						transformOrigin: "center",
						flexShrink: 0,
					}}
				>
					<Poster
						background={background}
						frameImg={frameImg}
						textBlockImg={textBlockImg}
						title={title}
						issue={issue}
						day={day}
						timeStart={timeStart}
						timeEnd={timeEnd}
						topText={topText}
						bottomText={bottomText}
						colors={colors}
						bgCanvasRef={bgCanvasRef}
						frameCanvasRef={frameCanvasRef}
						textCanvasRef={textCanvasRef}
						onBgReady={() => setBgReady(true)}
						onFrameReady={() => setFrameReady(true)}
						onTextReady={() => setTextReady(true)}
					/>
				</div>
			</main>
		</div>
	);
}

function ImageSection({
	label,
	slot,
	onFile,
	onParam,
	onColor,
}: {
	label: string;
	slot: ImageSlot;
	onFile: (file: File) => void;
	onParam: <K extends keyof HalftoneParams>(k: K, v: HalftoneParams[K]) => void;
	onColor: (key: "dark" | "light", v: string) => void;
}) {
	return (
		<section className="flex flex-col gap-3">
			<ImageDrop label={label} hasImage={!!slot.src} onFile={onFile} compact />
			<div className="flex gap-3">
				<ColorPicker label="Dark" value={slot.dark} onChange={(v) => onColor("dark", v)} />
				<ColorPicker label="Light" value={slot.light} onChange={(v) => onColor("light", v)} />
			</div>
			<details className="text-xs">
				<summary className="cursor-pointer text-ink-300 uppercase tracking-widest">
					Halftone
				</summary>
				<div className="mt-2 flex flex-col gap-3">
					<Slider
						label="Cell W"
						value={slot.params.cellW}
						min={2}
						max={64}
						step={1}
						format={String}
						onChange={(v) => onParam("cellW", v)}
					/>
					<Slider
						label="Cell H"
						value={slot.params.cellH}
						min={1}
						max={64}
						step={1}
						format={String}
						onChange={(v) => onParam("cellH", v)}
					/>
					<Slider
						label="Gamma"
						value={slot.params.gamma}
						min={0.1}
						max={3}
						step={0.05}
						format={(v) => v.toFixed(2)}
						onChange={(v) => onParam("gamma", v)}
					/>
					<Slider
						label="Rotation"
						value={slot.params.rotation}
						min={0}
						max={360}
						step={1}
						format={(v) => `${v}°`}
						onChange={(v) => onParam("rotation", v)}
					/>
				</div>
			</details>
		</section>
	);
}

function TextField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="flex min-w-0 flex-1 flex-col gap-1">
			<span className="text-[10px] text-ink-400 uppercase tracking-widest">{label}</span>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full min-w-0 rounded border border-ink-600 bg-ink-900 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
			/>
		</label>
	);
}

function TextArea({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="flex flex-col gap-1">
			<span className="text-[10px] text-ink-400 uppercase tracking-widest">{label}</span>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				rows={3}
				className="rounded border border-ink-600 bg-ink-900 p-2 text-xs text-ink-100 focus:border-accent focus:outline-none"
			/>
		</label>
	);
}

function Poster({
	background,
	frameImg,
	textBlockImg,
	title,
	issue,
	day,
	timeStart,
	timeEnd,
	topText,
	bottomText,
	colors,
	bgCanvasRef,
	frameCanvasRef,
	textCanvasRef,
	onBgReady,
	onFrameReady,
	onTextReady,
}: {
	background: ImageSlot;
	frameImg: ImageSlot;
	textBlockImg: ImageSlot;
	title: string;
	issue: string;
	day: string;
	timeStart: string;
	timeEnd: string;
	topText: string;
	bottomText: string;
	colors: PosterColors;
	bgCanvasRef: React.RefObject<HTMLCanvasElement | null>;
	frameCanvasRef: React.RefObject<HTMLCanvasElement | null>;
	textCanvasRef: React.RefObject<HTMLCanvasElement | null>;
	onBgReady: () => void;
	onFrameReady: () => void;
	onTextReady: () => void;
}) {
	const box = LAYOUT.textBlock;
	const tc = LAYOUT.timeCol;
	const fr = LAYOUT.frame;
	const centerX = tc.left + tc.width / 2;

	// Arrow y bounds between times
	const arrowTop = tc.yTop + tc.labelSize + tc.valueSize + 40;
	const arrowBottom = tc.yBottom - tc.valueSize - 20;

	return (
		<div
			style={{
				position: "relative",
				width: POSTER_W,
				height: POSTER_H,
				backgroundColor: colors.posterBackground,
				fontFamily: FONT_FAMILY,
				fontWeight: 900,
				fontStyle: "italic",
				overflow: "hidden",
				color: colors.textColor,
			}}
		>
			{background.src ? (
				<div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
					<HalftoneImage
						ref={bgCanvasRef}
						src={background.src}
						darkColor={background.dark}
						lightColor={background.light}
						cellW={background.params.cellW}
						cellH={background.params.cellH}
						gamma={background.params.gamma}
						rotation={background.params.rotation}
						outputWidth={POSTER_W}
						onReady={onBgReady}
						className="block h-full w-full object-cover"
					/>
				</div>
			) : null}

			{/* Title */}
			<div
				style={{
					position: "absolute",
					left: LAYOUT.title.x,
					top: LAYOUT.title.y - LAYOUT.title.size,
					fontSize: LAYOUT.title.size,
					lineHeight: 1,
					letterSpacing: "-0.02em",
				}}
			>
				{title.toUpperCase()}
			</div>
			<div
				style={{
					position: "absolute",
					right: POSTER_W - LAYOUT.issue.xRight,
					top: LAYOUT.issue.y - LAYOUT.issue.size,
					fontSize: LAYOUT.issue.size,
					lineHeight: 1,
					letterSpacing: "-0.02em",
				}}
			>
				{issue.toUpperCase()}
			</div>

			{/* Frame halftone */}
			<div
				style={{
					position: "absolute",
					left: fr.x,
					top: fr.y,
					width: fr.w,
					height: fr.h,
					overflow: "hidden",
					borderBottomLeftRadius: fr.radiusBottom,
					borderBottomRightRadius: fr.radiusBottom,
				}}
			>
				{frameImg.src ? (
					<HalftoneImage
						ref={frameCanvasRef}
						src={frameImg.src}
						darkColor={frameImg.dark}
						lightColor={frameImg.light}
						cellW={frameImg.params.cellW}
						cellH={frameImg.params.cellH}
						gamma={frameImg.params.gamma}
						rotation={frameImg.params.rotation}
						outputWidth={fr.w}
						onReady={onFrameReady}
						className="block h-full w-full object-cover"
					/>
				) : null}
			</div>

			{/* Time column — all centered on centerX */}
			<div
				style={{
					position: "absolute",
					left: tc.left,
					top: tc.yTop - tc.labelSize,
					width: tc.width,
					fontSize: tc.labelSize,
					lineHeight: 1,
					textAlign: "center",
				}}
			>
				{day.toUpperCase()}
			</div>
			<div
				style={{
					position: "absolute",
					left: tc.left,
					top: tc.yTop + 10,
					width: tc.width,
					fontSize: tc.valueSize,
					lineHeight: 1,
					textAlign: "center",
				}}
			>
				{timeStart}
			</div>
			{/* Arrow line */}
			<div
				style={{
					position: "absolute",
					left: centerX - 4,
					top: arrowTop,
					width: 8,
					height: arrowBottom - 40 - arrowTop,
					background: colors.arrowColor,
				}}
			/>
			{/* Arrowhead */}
			<div
				style={{
					position: "absolute",
					left: centerX - 18,
					top: arrowBottom - 40,
					width: 36,
					height: 40,
					background: colors.arrowColor,
					clipPath: "polygon(0 0, 100% 0, 50% 100%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					left: tc.left,
					top: tc.yBottom - tc.valueSize,
					width: tc.width,
					fontSize: tc.valueSize,
					lineHeight: 1,
					textAlign: "center",
				}}
			>
				{timeEnd}
			</div>

			{/* Text block halftone */}
			<div
				style={{
					position: "absolute",
					left: box.x,
					top: box.y,
					width: box.w,
					height: box.h,
					overflow: "hidden",
					backgroundColor: colors.posterBackground,
				}}
			>
				{textBlockImg.src ? (
					<HalftoneImage
						ref={textCanvasRef}
						src={textBlockImg.src}
						darkColor={textBlockImg.dark}
						lightColor={textBlockImg.light}
						cellW={textBlockImg.params.cellW}
						cellH={textBlockImg.params.cellH}
						gamma={textBlockImg.params.gamma}
						rotation={textBlockImg.params.rotation}
						outputWidth={box.w}
						onReady={onTextReady}
						className="block h-full w-full object-cover"
					/>
				) : null}
			</div>

			{/* Text block content — top + bottom, space-between */}
			<div
				style={{
					position: "absolute",
					left: box.x,
					top: box.y,
					width: box.w,
					height: box.h,
					padding: `${box.padY}px ${box.padX}px`,
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					fontSize: box.textSize,
					lineHeight: `${box.lineHeight}px`,
					overflow: "hidden",
					pointerEvents: "none",
				}}
			>
				<div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
					{topText.toUpperCase()}
				</div>
				<div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
					{bottomText.toUpperCase()}
				</div>
			</div>

			{/* Logo — plain SVG, centered below text block */}
			<img
				src={logoUrl}
				alt=""
				style={{
					position: "absolute",
					left: LAYOUT.logo.xCenter - LAYOUT.logo.w / 2,
					top: LAYOUT.logo.yTop,
					width: LAYOUT.logo.w,
					height: LAYOUT.logo.h,
					objectFit: "contain",
				}}
			/>
		</div>
	);
}
