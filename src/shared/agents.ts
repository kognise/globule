import { Vec2 } from './vec.js';

import agentSprout from './sim/sprout.js';
import agentOak from './sim/oak.js';
import agentSunlight from './sim/sunlight.js';
import agentAcorn from './sim/acorn.js';
import agentSquirrel from './sim/squirrel.js';
import { State } from '../server/index.js';
const agents = {
	sprout: agentSprout,
	oak: agentOak,
	sunlight: agentSunlight,
	acorn: agentAcorn,
	squirrel: agentSquirrel
};

export default agents;
export type AgentKind = keyof typeof agents;

export interface AgentActions {
	destroy(destroy?: boolean): void,
	destroyAgent(id: number, destroy?: boolean): void,
	spawn<Kind extends AgentKind>(
		kind: Kind, pos: Vec2,
		partialState?: Partial<typeof agents[Kind]['initialState']>
	): void,
	drop<Kind extends AgentKind>(
		kind: Kind,
		partialState?: Partial<typeof agents[Kind]['initialState']>
	): Vec2
}

export interface AgentConfig<T> {
	shop?: { price: number, emoji: string, blockRadius: number },
	initialState: T,
	onSpawn?: (i: AgentInstance<T>, a: AgentActions, s: State) => void,
	onTick?: (i: AgentInstance<T>, a: AgentActions, s: State) => void,
	onBeforeDestroy?: (i: AgentInstance<T>, a: AgentActions, s: State) => void,
	draw(
		ctx: CanvasRenderingContext2D,
		i: AgentInstance<T>,
		elapsed: DOMHighResTimeStamp
	): void
}

export interface AgentInstance<T> {
	id: number,
	kind: AgentKind,
	ticksOld: number,
	pos: Vec2,
	state: T
}

export const isInstance = <Kind extends AgentKind>(i: AgentInstance<unknown>, kind: Kind):
	i is AgentInstance<typeof agents[Kind]['initialState']> =>
	i.kind === kind;