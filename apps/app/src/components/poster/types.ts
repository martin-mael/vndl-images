export type HalftoneParams = {
	cellW: number;
	cellH: number;
	gamma: number;
	rotation: number;
};

export type ImageSlot = {
	src: string | null;
	params: HalftoneParams;
	dark: string;
	light: string;
};

export type PosterColors = {
	textColor: string;
	arrowColor: string;
	logoColor: string;
};

export const POSTER_W = 1080;
export const POSTER_H = 1920;

export const defaultHalftone: HalftoneParams = {
	cellW: 12,
	cellH: 6,
	gamma: 0.8,
	rotation: 45,
};
