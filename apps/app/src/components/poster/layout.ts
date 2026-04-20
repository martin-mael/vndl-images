import { POSTER_H, POSTER_W } from "./types";

// All coordinates in logical poster pixels (1080 x 1920).
const FRAME_X = 60;
const FRAME_Y = 250;
const FRAME_W = POSTER_W - 120;
const FRAME_H = 1560;
const TEXT_MARGIN = 70;

const TIME_COL_LEFT = FRAME_X;
const TIME_COL_WIDTH = 320;

const TEXT_BLOCK_X = FRAME_X + TIME_COL_WIDTH;
const TEXT_BLOCK_Y = FRAME_Y + TEXT_MARGIN;
const TEXT_BLOCK_W = FRAME_W - TIME_COL_WIDTH - TEXT_MARGIN;
const TEXT_BLOCK_H = 1280;

const LOGO_W = 380;
const LOGO_H = 90;

export const LAYOUT = {
	title: {
		x: 60,
		y: 230,
		size: 84,
	},
	issue: {
		xRight: POSTER_W - 60,
		y: 230,
		size: 84,
	},
	frame: {
		x: FRAME_X,
		y: FRAME_Y,
		w: FRAME_W,
		h: FRAME_H,
		radiusBottom: 40,
	},
	timeCol: {
		left: TIME_COL_LEFT,
		width: TIME_COL_WIDTH,
		yTop: 370,
		yBottom: 1530,
		labelSize: 52,
		valueSize: 60,
	},
	textBlock: {
		x: TEXT_BLOCK_X,
		y: TEXT_BLOCK_Y,
		w: TEXT_BLOCK_W,
		h: TEXT_BLOCK_H,
		padX: 40,
		padY: 50,
		textSize: 56,
		lineHeight: 66,
	},
	logo: {
		xCenter: TEXT_BLOCK_X + TEXT_BLOCK_W / 2,
		yTop: TEXT_BLOCK_Y + TEXT_BLOCK_H + 20,
		w: LOGO_W,
		h: LOGO_H,
	},
};

export { POSTER_H, POSTER_W };
