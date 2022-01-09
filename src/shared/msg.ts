import { Vec2 } from './vec'

export type ServerOutboundMsg = {
	kind: 'stateDiff',
	body: unknown,
}

export type ServerInboundMsg =
| {
	kind: 'ready'
}
| {
	kind: 'placeTree',
	body: Vec2
}
| {
	kind: 'cursorAt',
	body: Vec2
}