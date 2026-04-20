import { LAYOUT, POSTER_H, POSTER_W } from "./layout";
import type { PosterColors } from "./types";

const FONT_STACK = '"Rubik", sans-serif';
const FONT_WEIGHT_STYLE = "italic 900";

function wrapLines(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = "";
	for (const word of words) {
		const test = line ? `${line} ${word}` : word;
		if (ctx.measureText(test).width > maxWidth && line) {
			lines.push(line);
			line = word;
		} else {
			line = test;
		}
	}
	if (line) lines.push(line);
	return lines;
}

function drawLines(
	ctx: CanvasRenderingContext2D,
	lines: string[],
	x: number,
	y: number,
	lineHeight: number,
) {
	for (let i = 0; i < lines.length; i++) {
		ctx.fillText(lines[i], x, y + i * lineHeight);
	}
}

function drawArrow(
	ctx: CanvasRenderingContext2D,
	x: number,
	y1: number,
	y2: number,
	color: string,
) {
	const headH = 40;
	const headW = 36;
	ctx.strokeStyle = color;
	ctx.fillStyle = color;
	ctx.lineWidth = 8;
	ctx.beginPath();
	ctx.moveTo(x, y1);
	ctx.lineTo(x, y2 - headH);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(x - headW / 2, y2 - headH);
	ctx.lineTo(x + headW / 2, y2 - headH);
	ctx.lineTo(x, y2);
	ctx.closePath();
	ctx.fill();
}

function drawImageCover(
	ctx: CanvasRenderingContext2D,
	img: CanvasImageSource,
	srcW: number,
	srcH: number,
	dx: number,
	dy: number,
	dw: number,
	dh: number,
) {
	if (!srcW || !srcH) return;
	const sRatio = srcW / srcH;
	const dRatio = dw / dh;
	let sx = 0;
	let sy = 0;
	let sWidth = srcW;
	let sHeight = srcH;
	if (sRatio > dRatio) {
		sWidth = srcH * dRatio;
		sx = (srcW - sWidth) / 2;
	} else {
		sHeight = srcW / dRatio;
		sy = (srcH - sHeight) / 2;
	}
	ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
}

function pathRoundedBottom(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) {
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + w, y);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.closePath();
}

function loadSvg(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = url;
	});
}

async function ensureFonts() {
	if (typeof document === "undefined") return;
	try {
		await Promise.all([
			document.fonts.load(`${FONT_WEIGHT_STYLE} ${LAYOUT.title.size}px Rubik`),
			document.fonts.load(`${FONT_WEIGHT_STYLE} ${LAYOUT.textBlock.textSize}px Rubik`),
			document.fonts.load(`${FONT_WEIGHT_STYLE} ${LAYOUT.timeCol.valueSize}px Rubik`),
		]);
	} catch {
		// no-op
	}
}

export type ExportArgs = {
	backgroundCanvas: HTMLCanvasElement | null;
	frameCanvas: HTMLCanvasElement | null;
	textBlockCanvas: HTMLCanvasElement | null;
	/** Solid fill used behind the whole poster when no background image is uploaded. */
	backgroundFill: string;
	/** Solid fill used inside the text block when no text-block image is uploaded. */
	textBlockFill: string;
	logoUrl: string;
	title: string;
	issue: string;
	day: string;
	timeStart: string;
	timeEnd: string;
	topText: string;
	bottomText: string;
	colors: PosterColors;
};

export async function renderPoster(canvas: HTMLCanvasElement, args: ExportArgs) {
	canvas.width = POSTER_W;
	canvas.height = POSTER_H;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	await ensureFonts();

	const { colors } = args;

	// 1. Solid poster background (only visible if no background halftone)
	ctx.fillStyle = args.backgroundFill;
	ctx.fillRect(0, 0, POSTER_W, POSTER_H);

	// 2. Background halftone
	if (args.backgroundCanvas) {
		drawImageCover(
			ctx,
			args.backgroundCanvas,
			args.backgroundCanvas.width,
			args.backgroundCanvas.height,
			0,
			0,
			POSTER_W,
			POSTER_H,
		);
	}

	// 3. Title + issue
	ctx.fillStyle = colors.textColor;
	ctx.textBaseline = "alphabetic";
	ctx.font = `${FONT_WEIGHT_STYLE} ${LAYOUT.title.size}px ${FONT_STACK}`;
	ctx.textAlign = "left";
	ctx.fillText(args.title.toUpperCase(), LAYOUT.title.x, LAYOUT.title.y);
	ctx.textAlign = "right";
	ctx.fillText(args.issue.toUpperCase(), LAYOUT.issue.xRight, LAYOUT.issue.y);

	// 4. Frame halftone (rounded bottom, no stroke)
	const fr = LAYOUT.frame;
	if (args.frameCanvas) {
		ctx.save();
		pathRoundedBottom(ctx, fr.x, fr.y, fr.w, fr.h, fr.radiusBottom);
		ctx.clip();
		drawImageCover(
			ctx,
			args.frameCanvas,
			args.frameCanvas.width,
			args.frameCanvas.height,
			fr.x,
			fr.y,
			fr.w,
			fr.h,
		);
		ctx.restore();
	}

	// 5. Time column — centered horizontally within left column, arrow with own color
	const tc = LAYOUT.timeCol;
	const centerX = tc.left + tc.width / 2;
	ctx.fillStyle = colors.textColor;
	ctx.textAlign = "center";
	ctx.font = `${FONT_WEIGHT_STYLE} ${tc.labelSize}px ${FONT_STACK}`;
	ctx.fillText(args.day.toUpperCase(), centerX, tc.yTop);
	ctx.font = `${FONT_WEIGHT_STYLE} ${tc.valueSize}px ${FONT_STACK}`;
	ctx.fillText(args.timeStart, centerX, tc.yTop + tc.labelSize + 10);
	ctx.fillText(args.timeEnd, centerX, tc.yBottom);
	drawArrow(
		ctx,
		centerX,
		tc.yTop + tc.labelSize + tc.valueSize + 40,
		tc.yBottom - tc.valueSize - 20,
		colors.arrowColor,
	);

	// 6. Text block halftone
	const box = LAYOUT.textBlock;
	if (args.textBlockCanvas) {
		ctx.save();
		ctx.beginPath();
		ctx.rect(box.x, box.y, box.w, box.h);
		ctx.clip();
		drawImageCover(
			ctx,
			args.textBlockCanvas,
			args.textBlockCanvas.width,
			args.textBlockCanvas.height,
			box.x,
			box.y,
			box.w,
			box.h,
		);
		ctx.restore();
	} else {
		ctx.fillStyle = args.textBlockFill;
		ctx.fillRect(box.x, box.y, box.w, box.h);
	}

	// 7. Text block content — top text at top, bottom text at bottom
	ctx.fillStyle = colors.textColor;
	ctx.font = `${FONT_WEIGHT_STYLE} ${box.textSize}px ${FONT_STACK}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	const textX = box.x + box.padX;
	const textW = box.w - box.padX * 2;

	if (args.topText.trim()) {
		const topLines = wrapLines(ctx, args.topText.toUpperCase(), textW);
		drawLines(ctx, topLines, textX, box.y + box.padY, box.lineHeight);
	}
	if (args.bottomText.trim()) {
		const bottomLines = wrapLines(ctx, args.bottomText.toUpperCase(), textW);
		const totalH = bottomLines.length * box.lineHeight;
		const startY = box.y + box.h - box.padY - totalH;
		drawLines(ctx, bottomLines, textX, startY, box.lineHeight);
	}
	ctx.textBaseline = "alphabetic";

	// 8. Logo — tinted with colors.logoColor, centered below text block
	try {
		const logoImg = await loadSvg(args.logoUrl);
		const nat = {
			w: logoImg.naturalWidth || 703,
			h: logoImg.naturalHeight || 167,
		};
		const ratio = nat.w / nat.h;
		let w = LAYOUT.logo.w;
		let h = w / ratio;
		if (h > LAYOUT.logo.h) {
			h = LAYOUT.logo.h;
			w = h * ratio;
		}
		const dx = LAYOUT.logo.xCenter - w / 2;
		const dy = LAYOUT.logo.yTop;
		// Tint: draw SVG to an offscreen canvas, then source-in fill with the chosen color.
		const off = document.createElement("canvas");
		off.width = Math.ceil(w);
		off.height = Math.ceil(h);
		const offCtx = off.getContext("2d");
		if (offCtx) {
			offCtx.drawImage(logoImg, 0, 0, w, h);
			offCtx.globalCompositeOperation = "source-in";
			offCtx.fillStyle = colors.logoColor;
			offCtx.fillRect(0, 0, off.width, off.height);
			ctx.drawImage(off, dx, dy);
		} else {
			ctx.drawImage(logoImg, dx, dy, w, h);
		}
	} catch {
		// ignore
	}
}

export async function renderPosterToBlob(args: ExportArgs): Promise<Blob | null> {
	const canvas = document.createElement("canvas");
	await renderPoster(canvas, args);
	return new Promise<Blob | null>((resolve) => {
		canvas.toBlob((blob) => resolve(blob), "image/png");
	});
}

export function triggerDownload(blob: Blob, filename = "poster.png") {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.download = filename;
	a.href = url;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPoster(args: ExportArgs) {
	const blob = await renderPosterToBlob(args);
	if (!blob) return null;
	triggerDownload(blob);
	return blob;
}
