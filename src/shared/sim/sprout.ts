import { AgentConfig } from '../agents.js';
import { fillCircle } from '../lib.js';
import { add, mulf, rotToVec2 } from '../vec.js';

const GOLDEN_RATIO = 1.618034;

const agent: AgentConfig<{}> = {
	price: 5,
	blockRadius: 40,
	initialState: {},
	onTick(i, a) {
		if (i.daysOld >= 730) return { destroy: true };

		if (Math.random() < 0.3) {
			let treeSunlight = Math.floor(i.daysOld / 365) + 1;
			while (treeSunlight) {
				const sunlight = Math.min(treeSunlight, Math.ceil(Math.random() * 4));
				treeSunlight -= sunlight;
				a.spawn(
					'sunlight',
					add(i.pos, mulf(15 + Math.random()*30, rotToVec2(Math.random() * Math.PI*2))),
					{ sunlight }
				);
			}
		}
	},
	draw(ctx, i) {
		const scale = 1 + Math.log2(Math.max(1, i.daysOld))*3;
		const death = i.daysOld > 365 ? (i.daysOld - 365)/365 : 0;
		let [ tx, ty ] = [ i.pos.x, i.pos.y ];
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

			ctx.fillStyle = `rgba(142, 60, 52)`
			fillCircle(ctx, 0, r, r);
			ctx.fillRect(w / -2.0, r, w, -h);
		}

		let treeColorGreen = [0, 117, 43];
		let treeColorBrown = [109, 93, 82];
		for (const { x, y, radius } of foliage) {
			const treeColor = treeColorGreen.map((x, i) => x + death*(treeColorBrown[i]-x));
			ctx.fillStyle = `rgba(${treeColor.join(',')})`;
			fillCircle(ctx, x, y, radius + 0.55 / 50);

			treeColorGreen = treeColorGreen.map(x => x + 10);
			treeColorBrown = treeColorBrown.map(x => x + 10);
		}

		ctx.restore();
	}
};

export default agent;