import { AgentConfig } from '../agents.js';
import { drawTree, ticksToDays, ticksToYears } from '../lib.js';

const agent: AgentConfig<{ nextAcorn: number }> = {
	shop: { price: 60, emoji: '🌰', blockRadius: 60 },
	initialState: { nextAcorn: 0 },
	onSpawn(i) {
		// i.state.nextAcorn = 24 + Math.ceil(Math.random() * 6);
		i.state.nextAcorn = 0;
	},
	onTick(i, a) {
		if (ticksToYears(i.ticksOld) >= 10) return a.destroy();

		if (i.ticksOld >= i.state.nextAcorn) {
			i.state.nextAcorn = 20 + Math.ceil(Math.random() * 25) + i.ticksOld;
			a.drop('acorn', { tree: i.id });
		}
	},
	draw(ctx, i) {
		const scale = 1 + Math.log2(Math.max(1, ticksToDays(i.ticksOld)))*3;
		const death = ticksToYears(i.ticksOld) > 6 ? (ticksToYears(i.ticksOld) - 6)/4 : 0;
		drawTree(ctx, i.pos.x, i.pos.y, scale, death);

		ctx.fillStyle = 'black';
		ctx.font = Math.ceil(scale / 2) + 'px sans-serif';
		const nutPoses = [
			[  0.251305, -0.041763 ],
			[ -0.164654, -0.178857 ],
			[ -0.30375,   0.332293 ],
			[  0.463016,  0.174917 ],
			[  0.281365, -0.423763 ],
		];
		const treeCount = Math.min(nutPoses.length, scale * 0.114);
		for (let nut = 0; nut < treeCount; nut++) {
			let nx = i.pos.x + nutPoses[nut][0] * scale * 2.2;
			let ny = i.pos.y + nutPoses[nut][1] * scale * 2.2 - 2.2 * scale;
			ctx.fillText('🌰', nx - scale/2, ny - scale/2);
		}
	}
};

export default agent;