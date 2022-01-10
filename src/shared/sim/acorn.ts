import { AgentConfig } from '../agents.js';
import { ticksToDays } from '../lib.js';

const agent: AgentConfig<{}> = {
	initialState: {},
	onTick(i, a) {
		if (ticksToDays(i.ticksOld) > 30 && Math.random() < 0.05) {
			a.drop('squirrel');
			a.destroy();
		}
	},
	draw(ctx, i) {
		const scale = 20;
		ctx.fillStyle = 'black';
		ctx.font = Math.ceil(scale / 2) + 'px sans-serif';
		ctx.fillText('🌰', i.pos.x - scale/2, i.pos.y - scale/2);
	}
};
		
export default agent;