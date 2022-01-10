import { AgentKind } from './agents'
import { Vec2 } from './vec'

export type ServerOutboundMsg = 
| {
	kind: 'stateDiff',
	body: unknown,
}
| {
	kind: 'id',
	body: { id: number }
}

export type ServerInboundMsg =
| {
	kind: 'ready'
}
| {
	kind: 'spawnAgent',
	body: {
		kind: AgentKind,
		pos: Vec2
	}
}
| {
	kind: 'cursorAt',
	body: Vec2
}