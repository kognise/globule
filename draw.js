const GOLDEN_RATIO = 1.618034;

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

const xyInBox = (x, y, bx, by, bw, bh) => x >= bx && x <= (bx + bw)
&&                                        y >= by && y <= (by + bh);

const mouse = { x: 0, y: 0 };

export const init = (element) => {
	canvas = element;
	ctx = canvas.getContext('2d');

	window.addEventListener('mousemove', ev => {
		mouse.x = ev.pageX;
		mouse.y = ev.pageY;
	}, { passive: true });
}

const fillCircle = (x, y, r) => {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
}

export const drawTree = (tx, ty, scale, death, alpha = 1) => {
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

let prevElapsed
export const frame = ({ pan, srv: { sunlight, trees, sunGlobs } }, elapsed) => {
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

	for (let x = 0; x < Math.floor(window.innerWidth / 256); x++) {
		for (let y = 0; y < Math.floor(window.innerHeight / 256); y++) {

			ctx.fillStyle = 'green';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	}

	ctx.save();
	ctx.translate(-pan.x, -pan.y);
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