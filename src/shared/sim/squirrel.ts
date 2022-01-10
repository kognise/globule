import { AgentConfig, isInstance } from '../agents.js';
import { add, dist, mulf, norm, sub, mag } from '../vec.js';

enum SquirrelState { Seeking, Hunting, Burying }

const agent: AgentConfig<{ tree: number | null, fsm: SquirrelState, target: number | null }> = {
	initialState: { tree: null, fsm: SquirrelState.Seeking, target: null },
	onTick(i, a, s) {
		if (i.state.fsm === SquirrelState.Seeking) {
			i.state.target = Object.values(s.agents)
				.filter((a) => isInstance(a, 'acorn'))
				.sort((a, b) => dist(a.pos, i.pos) - dist(b.pos, i.pos))[0]?.id;
			if (i.state.target) i.state.fsm = SquirrelState.Hunting;
		} else if (i.state.fsm === SquirrelState.Hunting) {
			const tgt = s.agents[i.state.target!]
			if (!tgt) return i.state.fsm = SquirrelState.Seeking;
			const delta = sub(i.pos, tgt.pos);
			i.pos = add(mulf(7, norm(delta)), i.pos);

			if (mag(delta) < 5) {
				if (Math.random() < 0.6)
					a.destroyAgent(i.state.target!);
				else 
					i.state.fsm = SquirrelState.Burying;
			}
		} else if (i.state.fsm === SquirrelState.Burying) {

		}
	},
	draw(ctx, i, elapsed) {
		const scale = 25;
		ctx.fillStyle = 'black';
		ctx.font = Math.ceil(scale / 2) + 'px sans-serif';
		ctx.save();
		ctx.translate(i.pos.x, i.pos.y);
		ctx.rotate(0.4 * Math.sin(i.pos.x + i.pos.y + elapsed * 0.01));
		ctx.fillText('🐿️', -scale/2, -scale/2);
		ctx.restore();
	}
};
		
export default agent;