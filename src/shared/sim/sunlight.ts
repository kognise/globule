import { AgentConfig } from '../agents.js';
import { fillCircle } from '../lib.js';

const agent: AgentConfig<{ sunlight: number }> = {
	blockRadius: 0,
	initialState: { sunlight: 0 },
	draw(ctx, i, elapsed) {
		const scale = 1 + i.state.sunlight * 2.5;
		const off = Math.sin(i.pos.x + i.pos.y + elapsed * 0.005) * 5;

		ctx.fillStyle = 'rgba(255,255,0,0.3)';
		fillCircle(ctx, i.pos.x, i.pos.y + off, scale/2);
		fillCircle(ctx, i.pos.x, i.pos.y + off, scale);
	}
};

export default agent;