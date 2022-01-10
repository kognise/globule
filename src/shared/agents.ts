import { Vec2 } from './vec.js';

import agentSprout from './sim/sprout.js';
import agentSunlight from './sim/sunlight.js';
const agents = {
	sprout: agentSprout,
	sunlight: agentSunlight
};

export default agents;
export type AgentKind = keyof typeof agents;

export interface AgentActions {
	destroy: (destroy?: boolean) => void,
	spawn: <Kind extends AgentKind>(
		kind: Kind, pos: Vec2,
		partialState?: Partial<typeof agents[Kind]['initialState']>
	) => void,
}

export interface AgentConfig<T> {
	initialState: T,
	blockRadius: number,
	price?: number,
	onTick?: (i: AgentInstance<T>, a: AgentActions) => void,
	onBeforeDestroy?: (i: AgentInstance<T>, a: AgentActions) => void,
	draw: (
		ctx: CanvasRenderingContext2D,
		i: AgentInstance<T>,
		elapsed: DOMHighResTimeStamp
	) => void
}

export interface AgentInstance<T> {
	kind: AgentKind,
	daysOld: number,
	pos: Vec2,
	state: T
}

export const isInstance = <Kind extends AgentKind>(i: AgentInstance<unknown>, kind: Kind):
	i is AgentInstance<typeof agents[Kind]['initialState']> =>
	i.kind === kind;