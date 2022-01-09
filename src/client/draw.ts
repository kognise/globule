import { Vec2 } from '../shared/vec.js';
import { State } from './script.js';
import config from '../shared/config.js';
const { prices } = config;

const GOLDEN_RATIO = 1.618034;

const dirt = new Image();
dirt.src = 'textures/dirt-shit.png';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const xyInBox = ({ x, y }: Vec2, { x: bx, y: by }: Vec2, bw: number, bh: number) =>
	x >= bx && x <= (bx + bw) &&
	y >= by && y <= (by + bh);

const mouse: Vec2 = { x: 0, y: 0 };

const rotationMatrix = [
	[1, 0, 1, 3, 3, 1, 1, 0, 1, 2, 3, 1, 2, 0, 1, 1, 0, 2, 1, 3, 2, 1, 3, 2, 1, 2, 0, 3, 1, 0, 3, 2],
	[1, 2, 1, 0, 2, 0, 2, 3, 2, 0, 2, 1, 3, 2, 3, 2, 2, 1, 1, 2, 0, 2, 1, 0, 1, 3, 1, 2, 2, 1, 1, 2],
	[0, 3, 2, 2, 1, 2, 2, 2, 1, 1, 2, 1, 1, 0, 1, 1, 2, 3, 0, 3, 1, 2, 1, 3, 2, 2, 0, 1, 2, 3, 3, 1],
	[2, 0, 3, 1, 1, 3, 0, 0, 1, 2, 3, 0, 2, 2, 3, 0, 1, 2, 1, 2, 0, 3, 1, 2, 0, 1, 2, 3, 1, 0, 1, 2],
	[2, 1, 1, 3, 2, 1, 1, 3, 3, 1, 0, 3, 1, 2, 1, 2, 1, 0, 3, 2, 1, 1, 2, 0, 2, 1, 1, 2, 2, 1, 0, 2],
	[1, 0, 2, 1, 0, 2, 2, 1, 2, 2, 2, 1, 1, 2, 1, 3, 3, 1, 2, 1, 3, 2, 0, 3, 2, 3, 0, 2, 0, 3, 1, 3],
	[2, 2, 0, 3, 2, 2, 1, 0, 1, 0, 3, 2, 0, 2, 0, 2, 2, 1, 0, 2, 0, 1, 1, 2, 1, 1, 3, 1, 1, 2, 2, 1],
	[1, 3, 2, 2, 0, 1, 3, 3, 2, 2, 1, 2, 3, 1, 3, 1, 1, 0, 2, 3, 1, 3, 2, 1, 0, 2, 1, 2, 3, 1, 0, 3],
	[1, 0, 1, 1, 1, 2, 1, 0, 2, 1, 0, 1, 1, 2, 1, 0, 2, 3, 2, 1, 1, 0, 2, 3, 3, 2, 0, 1, 2, 0, 1, 2],
	[2, 2, 2, 3, 3, 2, 0, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 1, 0, 2, 2, 1, 1, 0, 1, 2, 3, 2, 2, 2, 3],
	[0, 1, 0, 1, 0, 2, 1, 2, 1, 0, 3, 2, 1, 0, 0, 2, 1, 2, 1, 3, 2, 3, 1, 2, 2, 1, 1, 1, 0, 1, 1, 1],
	[1, 2, 3, 2, 1, 2, 2, 3, 1, 2, 1, 0, 2, 3, 1, 3, 1, 2, 0, 2, 0, 1, 2, 0, 1, 3, 2, 2, 0, 2, 3, 2],
	[2, 1, 2, 1, 3, 0, 1, 0, 2, 3, 1, 1, 2, 2, 1, 2, 0, 3, 2, 1, 1, 2, 1, 3, 2, 1, 0, 2, 3, 1, 0, 2],
	[1, 3, 0, 1, 2, 1, 2, 1, 0, 2, 2, 0, 3, 1, 2, 1, 2, 1, 2, 1, 3, 0, 2, 0, 1, 2, 1, 3, 1, 1, 1, 3],
	[1, 2, 0, 2, 2, 1, 3, 3, 1, 1, 3, 2, 1, 1, 0, 3, 2, 0, 2, 0, 3, 1, 2, 3, 1, 1, 2, 0, 2, 2, 2, 0],
	[1, 3, 2, 3, 2, 0, 1, 2, 2, 1, 0, 1, 3, 2, 1, 0, 2, 1, 3, 1, 2, 1, 1, 2, 2, 2, 3, 0, 1, 3, 2, 1],
	[2, 1, 0, 1, 1, 2, 1, 0, 2, 1, 3, 2, 2, 1, 2, 3, 2, 1, 0, 1, 2, 3, 1, 0, 0, 1, 2, 1, 1, 1, 0, 3],
	[2, 2, 1, 2, 3, 1, 3, 2, 2, 3, 0, 1, 0, 2, 0, 1, 2, 1, 3, 2, 0, 2, 3, 2, 1, 3, 1, 2, 3, 2, 2, 1],
	[3, 1, 0, 2, 0, 1, 2, 0, 1, 1, 2, 2, 1, 3, 1, 3, 0, 2, 2, 1, 1, 0, 2, 1, 2, 2, 1, 0, 2, 2, 1, 0],
	[2, 1, 3, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 2, 1, 2, 0, 1, 3, 2, 2, 0, 1, 3, 0, 2, 0, 1, 0, 2, 1],
	[0, 1, 1, 2, 0, 1, 2, 3, 0, 2, 0, 1, 3, 0, 2, 1, 2, 2, 3, 1, 0, 3, 2, 1, 1, 3, 1, 3, 2, 1, 3, 3],
	[1, 3, 2, 0, 2, 1, 2, 2, 1, 1, 3, 2, 1, 0, 2, 3, 0, 1, 1, 2, 1, 1, 3, 2, 0, 2, 1, 1, 2, 2, 0, 2],
	[2, 2, 0, 3, 2, 1, 0, 2, 1, 2, 2, 0, 2, 2, 1, 2, 1, 2, 0, 2, 3, 2, 1, 2, 1, 2, 2, 0, 3, 1, 1, 2],
	[0, 2, 1, 1, 3, 3, 0, 1, 3, 0, 3, 1, 1, 3, 1, 3, 1, 3, 2, 1, 0, 2, 0, 3, 0, 3, 1, 2, 0, 1, 2, 1],
	[3, 1, 1, 2, 0, 1, 2, 2, 1, 1, 2, 0, 1, 2, 0, 2, 0, 2, 1, 2, 3, 1, 1, 2, 1, 1, 3, 1, 2, 3, 0, 1],
	[2, 1, 3, 2, 1, 2, 2, 0, 2, 1, 2, 3, 3, 2, 1, 0, 1, 1, 3, 1, 2, 1, 3, 2, 1, 2, 0, 2, 1, 1, 2, 3],
	[2, 0, 2, 0, 2, 1, 3, 1, 3, 2, 0, 2, 1, 0, 3, 2, 2, 2, 0, 0, 2, 1, 2, 0, 2, 3, 2, 0, 2, 2, 1, 0],
	[2, 1, 2, 1, 3, 1, 2, 0, 1, 2, 1, 1, 1, 2, 2, 1, 1, 2, 3, 1, 2, 3, 0, 1, 2, 1, 1, 1, 3, 2, 0, 3],
	[2, 1, 3, 0, 1, 2, 3, 1, 1, 3, 0, 3, 1, 2, 1, 0, 3, 0, 1, 2, 1, 2, 1, 3, 0, 1, 2, 2, 0, 1, 1, 1],
	[0, 1, 3, 2, 1, 2, 1, 0, 2, 2, 1, 2, 3, 0, 3, 1, 2, 2, 1, 3, 0, 1, 2, 1, 3, 2, 3, 1, 3, 2, 1, 3],
	[0, 2, 1, 2, 0, 0, 2, 3, 1, 3, 1, 0, 2, 1, 2, 2, 1, 0, 1, 2, 1, 3, 2, 0, 1, 2, 0, 1, 2, 2, 2, 1],
	[3, 2, 1, 2, 1, 3, 2, 1, 2, 0, 2, 1, 2, 1, 0, 3, 3, 1, 2, 2, 0, 1, 2, 0, 3, 1, 2, 1, 2, 0, 1, 2]
];

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

let prevElapsed: number;
export const frame = (state: State, elapsed: number) => {
	const { pan, id, srv: { sunlight, trees, sunGlobs, clients } } = state;
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

	for (const { cursor, id: clientId } of Object.values(clients)) {
		if (clientId === id) {
			renders.push({
				zIndex: Infinity, render() {
					ctx.fillStyle = 'rgba(121,80,242,0.3)';
					fillCircle(mouse.x + pan.x - 15, mouse.y + pan.y - 15, 30);
				}
			});
		} else {
			renders.push({
				zIndex: Infinity, render() {
					ctx.fillStyle = 'rgba(255,255,255,0.2)';
					fillCircle(cursor.x - 10, cursor.y - 10, 20);
				}
			});
		}
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
			const rotation = [ 0, 90, 180, 270 ][rotationMatrix[Math.abs(x) % 32][Math.abs(y) % 32]];

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
	ctx.fillStyle = ctx.strokeStyle = 'rgb(240, 210, 200)';
	ctx.lineWidth = 1;
	ctx.font = '36px sans-serif';
	ctx.fillText('☀️ ' + sunlight, 0, 10);

	const mojis: Record<keyof typeof prices, string> = {
		'sprout': '🌳️',
		'oak': '🌰'
	};
	let down = 18;
	for (const k of Object.keys(prices) as (keyof typeof prices)[]) {
		down += 40;
		const x = 20, y = down, w = 112, h = 26;

		const overButton = xyInBox(mouse, { x, y }, w, h);
		if (state.mouseDown && overButton)
			state.selectedTree = k;
		ctx.setLineDash(overButton ? [5, 5] : []);

		ctx.font = '16px sans-serif';
		ctx.strokeRect(x, y, w, h);
		ctx.fillText(
			mojis[k] +' buy: ' + ('☀️' + prices[k]).padStart(6),
			x+2, y+7
		);
	}

	prevElapsed = elapsed;
}
