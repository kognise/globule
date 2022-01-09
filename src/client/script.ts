import * as draw from './draw.js';
import { State as ServerState } from '../server/index.js';
import { Vec2 } from '../shared/vec.js';
import { applyDiff, transformWeirdUndefineds } from '../shared/lib.js';

const ws = new WebSocket('ws://localhost:3000');

export interface PartialState {
	pan: { x: number, y: number },
	srv?: ServerState
}
export type State = PartialState & { srv: ServerState }
const isntPartial = (state: PartialState): state is State => state.srv !== undefined

Promise.all([
	new Promise((res) => window.onload = res),
	new Promise((res) => ws.onopen = res)
]).then(() => {
	let state: PartialState = {
		pan: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
	};
	draw.init(document.getElementById('canvas') as HTMLCanvasElement);

	ws.onmessage = (e) => {
		const msg = JSON.parse(e.data);
		transformWeirdUndefineds(msg);
		
		switch (msg.kind) {
			case 'stateDiff': {
				state.srv = applyDiff(state.srv ?? {}, msg.body);
				break;
			}
		}
	};
	ws.send(JSON.stringify({ kind: 'ready' }));
	
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
			ws.send(JSON.stringify({
				kind: 'placeTree',
				body: { x: ev.pageX + state.pan.x, y: ev.pageY + state.pan.y }
			}));
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
			ws.send(JSON.stringify({
				kind: 'grabGlobsAt',
				body: { x: ev.pageX + state.pan.x, y: ev.pageY + state.pan.y }
			}));
		}
	};
});

// Semicolons to make ced happy:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
// :) - ced