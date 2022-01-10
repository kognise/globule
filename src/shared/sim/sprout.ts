import { AgentConfig } from '../agents.js';
import { drawTree, ticksToDays, ticksToYears } from '../lib.js';

const agent: AgentConfig<{}> = {
	shop: { price: 5, emoji: '🌳️', blockRadius: 40 },
	initialState: {},
	onTick(i, a) {
		if (ticksToYears(i.ticksOld) >= 2) return a.destroy();

		if (Math.random() < 0.3) {
			let treeSunlight = Math.floor(ticksToYears(i.ticksOld)) + 1;
			while (treeSunlight) {
				const sunlight = Math.min(treeSunlight, Math.ceil(Math.random() * 4));
				treeSunlight -= sunlight;
				a.drop('sunlight', { sunlight });
			}
		}
	},
	draw(ctx, i) {
		const scale = 1 + Math.log2(Math.max(1, ticksToDays(i.ticksOld)))*3;
		const death = ticksToYears(i.ticksOld) > 1 ? ticksToYears(i.ticksOld) - 1 : 0;
		drawTree(ctx, i.pos.x, i.pos.y, scale, death);
	}
};

export default agent;