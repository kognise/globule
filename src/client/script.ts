import * as draw from './draw.js';
import { State as ServerState } from '../server/index.js';
import { add, Vec2 } from '../shared/vec.js';
import { applyDiff, transformWeirdUndefineds } from '../shared/lib.js';
import { ServerInboundMsg, ServerOutboundMsg } from '../shared/msg';
import { AgentKind } from '../shared/agents.js';

const wsUrl = new URL(window.location.href)
wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
const ws = new WebSocket(wsUrl);

export interface PartialState {
	srv?: ServerState,
	id?: number,
	pan: Vec2,
	selected: AgentKind | null,
	mouseDown: boolean,
}
export type State = PartialState & { srv: ServerState, id: number }
const isntPartial = (state: PartialState): state is State =>
	state.srv !== undefined && state.id !== undefined;

const send = (msg: ServerInboundMsg) => ws.send(JSON.stringify(msg));

Promise.all([
	new Promise((res) => window.onload = res),
	new Promise((res) => ws.onopen = res)
]).then(() => {
	const state: PartialState = {
		selected: null,
		mouseDown: false,
		pan: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
	};
	window.addEventListener('mousedown', () => state.mouseDown = true);
	window.addEventListener('mouseup', () => state.mouseDown = false);
	draw.init(document.getElementById('canvas') as HTMLCanvasElement);

	ws.onmessage = (e) => {
		const msg = JSON.parse(e.data) as ServerOutboundMsg;
		transformWeirdUndefineds(msg);
		
		switch (msg.kind) {
			case 'stateDiff': {
				state.srv = applyDiff(state.srv ?? {}, msg.body);
				break;
			}
			case 'id': {
				state.id = msg.body.id;
				break;
			}
		}
	};
	send({ kind: 'ready' });
	
	let loop: FrameRequestCallback;
	(loop = (elapsed) => {
		if (isntPartial(state)) draw.frame(state, elapsed);
		requestAnimationFrame(loop);
	})(0);

	window.oncontextmenu = (ev) => ev.preventDefault()

	let panStart: Vec2 | null = null
	window.onmousedown = (ev) => {
		if (ev.button === 0) {
			panStart = { x: ev.pageX, y: ev.pageY }
		} else if (ev.button === 2) {
			if (!isntPartial(state)) return
			if (state.selected === null) return;
			send({
				kind: 'spawnAgent',
				body: {
					pos: add(state.pan, { x: ev.pageX, y: ev.pageY }),
					kind: state.selected
				}
			});
		}
	};
	window.onmouseup = (ev) => {
		if (ev.button === 0) panStart = null
	}

	window.onmousemove = (ev) => {
		if (panStart) {
			state.pan.x -= ev.pageX - panStart.x
			state.pan.y -= ev.pageY - panStart.y
			panStart = { x: ev.pageX, y: ev.pageY }
		} else {
			if (!state.srv) return
			send({
				kind: 'cursorAt',
				body: { x: ev.pageX + state.pan.x, y: ev.pageY + state.pan.y }
			});
		}
	};
});

// Semicolons to make ced happy:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
// :) - ced
