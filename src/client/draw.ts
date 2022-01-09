import { State } from './script.js';

const GOLDEN_RATIO = 1.618034;

const dirt = new Image();
dirt.src = 'textures/dirt-shit.png';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const xyInBox = (x: number, y: number, bx: number, by: number, bw: number, bh: number) =>
	x >= bx && x <= (bx + bw) &&
	y >= by && y <= (by + bh);

const mouse = { x: 0, y: 0 };

export const init = (element: HTMLCanvasElement) => {
	canvas = element;
	ctx = canvas.getContext('2d')!;

	window.addEventListener('mousemove', ev => {
		mouse.x = ev.pageX;
		mouse.y = ev.pageY;
	}, { passive: true });

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}, { passive: true });
	window.dispatchEvent(new UIEvent('resize'));
}

const fillCircle = (x: number, y: number, r: number) => {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
}

export const drawTree = (tx: number, ty: number, scale: number, death: number, alpha = 1) => {
	tx += scale / 2;

	const foliage = [
		{ x: 0.80, y: 0.75 - 2.2, radius: 0.8 },
		{ x: 0.16, y: 0.75 - 3.0, radius: 1.0 },
		{ x: -0.80, y: 0.75 - 2.5, radius: 0.9 },
		{ x: -0.16, y: 0.75 - 2.0, radius: 0.8 },
	];

	ctx.save();
	ctx.translate(tx - scale / 2, ty - scale / 2);
	ctx.scale(scale, scale);
	{
		const w = 0.8;
		const h = GOLDEN_RATIO * 0.8;
		const r = 0.4;

		ctx.fillStyle = `rgba(142, 60, 52, ${alpha})`
		fillCircle(0, r, r);
		ctx.fillRect(w / -2.0, r, w, -h);
	}

	let treeColorGreen = [0, 117, 43];
	let treeColorBrown = [109, 93, 82];
	for (const { x, y, radius } of foliage) {
		const treeColor = treeColorGreen.map((x, i) => x + death*(treeColorBrown[i]-x));
		ctx.fillStyle = `rgba(${treeColor.join(',')}, ${alpha})`;
		fillCircle(x, y, radius + 0.55 / 50);

		treeColorGreen = treeColorGreen.map(x => x + 10);
		treeColorBrown = treeColorBrown.map(x => x + 10);
	}

	ctx.restore();
};

const mulberry2 = (t: number) => {
	t += 0x6d2b79f5;
	t = Math.imul(t ^ t >>> 15, t | 1);
	t ^= t + Math.imul(t ^ t >>> 7, t | 61);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

let prevElapsed: number;
export const frame = ({ pan, srv: { sunlight, trees, sunGlobs } }: State, elapsed: number) => {
	const delta = elapsed - prevElapsed;
	const renders = [];

	for (const tree of trees) {
		tree.daysOld = Math.min(730, tree.daysOld + delta*(6/1000));
		const { daysOld, pos: { x, y } } = tree;
		const scale = 1 + Math.log2(Math.max(1, daysOld))*3;

		renders.push({ zIndex: y, render: () => drawTree(
			x, y, scale,
			daysOld > 365 ? (daysOld - 365)/365 : 0
		)});
	}

	for (const { sunlight, pos: { x, y } } of Object.values(sunGlobs)) {
		const scale = 1 + sunlight * 2.5;
		const off = Math.sin(x + y + elapsed * 0.005) * 5;
		renders.push({
			zIndex: y, render() {
				ctx.fillStyle = 'rgba(255,255,0,0.3)';
				fillCircle(x, y + off, scale*0.5);
				fillCircle(x, y + off, scale);
			}
		});
	}

	ctx.save();
	ctx.translate(-pan.x, -pan.y);
	const tileSize = 128;
	for (let qx = 0; qx < Math.ceil(window.innerWidth / tileSize) + 2; qx++) {
		for (let qy = 0; qy < Math.ceil(window.innerHeight / tileSize) + 2; qy++) {
			const realTileSize = tileSize + 2;
			const x = (Math.floor(pan.x / tileSize) + qx);
			const y = (Math.floor(pan.y / tileSize) + qy);
			const ix = x * tileSize - 1;
			const iy = y * tileSize - 1;
			const rotation = [ 0, 90, 180, 270 ][Math.floor(mulberry2(x * y) * 4)];

			ctx.save();
			ctx.translate(ix + realTileSize/2, iy + realTileSize/2);
			ctx.rotate(rotation / 180 * Math.PI);
			ctx.drawImage(dirt, -realTileSize/2, -realTileSize/2, realTileSize, realTileSize);
			ctx.restore();
		}
	}

	renders.sort((a, b) => a.zIndex - b.zIndex);
	renders.forEach(x => x.render());
	ctx.restore();

	ctx.textBaseline = "top";
	ctx.fillStyle = 'black';
	ctx.font = '36px sans-serif';
	ctx.fillText('☀️ ' + sunlight, 0, 10);

	const overButton = xyInBox(mouse.x, mouse.y, 20, 58, 110, 26);
	ctx.setLineDash(overButton ? [5, 5] : []);
	ctx.font = '16px sans-serif';
	ctx.strokeRect(20, 58, 112, 26);
	ctx.fillText('🌳️ buy: ☀️1️0️0️', 22, 65);

	prevElapsed = elapsed;
}