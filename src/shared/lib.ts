export const stringify = (json: unknown) => JSON.stringify(json, (key, value) => {
	if (typeof value === 'undefined')
		return '__UNDEFINED_UWU_EVIL__';
	else
		return value;
});

export const applyDiff = <T extends unknown>(a: unknown, b: unknown): T => {
	// @ts-ignore-line
	for (const [ key, value ] of Object.entries(b)) {
		if (typeof value === 'object' && value) {
			// @ts-ignore-line
			if (!a[key]) a[key] = Array.isArray(value) ? [] : {}
			// @ts-ignore-line
			applyDiff(a[key], value)
		} else if (typeof value === 'undefined') {
			// @ts-ignore-line
			Array.isArray(a) ? a.splice(key, 1) : delete a[key]
		} else {
			// @ts-ignore-line
			a[key] = value
		}
	}
	// @ts-ignore-line
	return a
}

export const transformWeirdUndefineds = (object: unknown) => {
	if (typeof object !== 'object' || !object) return
	for (const [ key, value ] of Object.entries(object)) {
		if (value === '__UNDEFINED_UWU_EVIL__')
			// @ts-ignore-line
			object[key] = undefined
		else
			transformWeirdUndefineds(value)
	}
}

export const realMod = (x: number, n: number) => ((x % n) + n) % n

export const fillCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
}

const GOLDEN_RATIO = 1.618034;
export const drawTree = (ctx: CanvasRenderingContext2D, tx: number, ty: number, scale: number, death = 0, alpha = 1) => {
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
		fillCircle(ctx, 0, r, r);
		ctx.fillRect(w / -2.0, r, w, -h);
	}

	let treeColorGreen = [0, 117, 43];
	let treeColorBrown = [109, 93, 82];
	for (const { x, y, radius } of foliage) {
		const treeColor = treeColorGreen.map((x, i) => x + death*(treeColorBrown[i]-x));
		ctx.fillStyle = `rgba(${treeColor.join(',')},${alpha})`;
		fillCircle(ctx, x, y, radius + 0.55 / 50);

		treeColorGreen = treeColorGreen.map(x => x + 10);
		treeColorBrown = treeColorBrown.map(x => x + 10);
	}

	ctx.restore();
}

export const msPerTick = 1000;
export const ticksToDays = (ticks: number) => ticks * 6;
export const ticksToYears = (ticks: number) => ticks * 6 / 365;