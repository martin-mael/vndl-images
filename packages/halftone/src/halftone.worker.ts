interface Input {
	pixels: Uint8ClampedArray;
	w: number;
	h: number;
	dr: number;
	dg: number;
	db: number;
	lr: number;
	lg: number;
	lb: number;
	cellW: number;
	cellH: number;
	gamma: number;
	rotation: number;
}

onmessage = ({ data }: MessageEvent<Input>) => {
	const { pixels, w, h, dr, dg, db, lr, lg, lb, cellW, cellH, gamma, rotation } = data;
	const out = new Uint8ClampedArray(w * h * 4);
	const theta = (rotation * Math.PI) / 180;
	const cosA = Math.cos(theta);
	const sinA = Math.sin(theta);

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			let g =
				(0.2126 * pixels[i] +
					0.7152 * pixels[i + 1] +
					0.0722 * pixels[i + 2]) /
				255;
			g **= gamma;
			const u = x * cosA + y * sinA;
			const v = -x * sinA + y * cosA;
			const cellCol = Math.floor(u / cellW);
			const stagger = (((cellCol % 2) + 2) % 2) * (cellH / 2);
			const uPhase = (((u % cellW) + cellW) % cellW) / cellW;
			const vPhase = ((((v + stagger) % cellH) + cellH) % cellH) / cellH;
			const threshold = Math.max(
				Math.abs(uPhase - 0.5) * 2,
				Math.abs(vPhase - 0.5) * 2,
			);
			const on = g > threshold;
			out[i] = on ? lr : dr;
			out[i + 1] = on ? lg : dg;
			out[i + 2] = on ? lb : db;
			out[i + 3] = 255;
		}
	}

	postMessage(out, { transfer: [out.buffer] });
};
