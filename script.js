import * as draw from '/draw.js';

const ws = new WebSocket('wss://ShortDismalMemorypool.kognise.repl.co');

const applyDiff = (a, b) => {
	for (const [ key, value ] of Object.entries(b)) {
		if (typeof value === 'object') {
			if (!a[key]) a[key] = Array.isArray(value) ? [] : {}
			applyDiff(a[key], value)
		} else if (typeof value === 'undefined') {
			Array.isArray(a) ? a.splice(key, 1) : delete a[key]
		} else {
			a[key] = value
		}
	}
	return a
}

const transformWeirdUndefineds = (object) => {
	if (typeof object !== 'object') return
	for (const [ key, value ] of Object.entries(object)) {
		if (value === '__UNDEFINED_UWU_EVIL__')
			object[key] = undefined
		else
			transformWeirdUndefineds(value)
	}
}

Promise.all([
	new Promise((res) => window.onload = res),
	new Promise((res) => ws.onopen = res)
]).then(() => {
	let state = {
		pan: { x: canvas.width/-2, y: canvas.height/-2 },
	};
	draw.init(document.getElementById('canvas'));

	ws.onmessage = e => {
		const msg = JSON.parse(e.data);
		transformWeirdUndefineds(msg);
		
		switch (msg.kind) {
			case 'stateDiff': {
				if (!state.srv) state.srv = {};
				applyDiff(state.srv, msg.body);
				break;
			}
		}
	};
	
	let loop;
	(loop = elapsed => {
		if (state.srv) draw.frame(state, elapsed);
		requestAnimationFrame(loop);
	})();

	window.oncontextmenu = (ev) => ev.preventDefault()

	let panStart = null
	window.onmousedown = (ev) => {
		if (ev.button === 0) {
			panStart = { x: ev.pageX, y: ev.pageY }
		} else if (ev.button === 2) {
			if (!state.srv) return
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

(window.onresize = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
})();

// Semicolons to make ced happy:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
// :) - ced