import { WebSocketServer } from 'ws';
import { Vec2, add, mulf, rotToVec2, dist } from '../shared/vec.js';
import { diff } from 'deep-object-diff';
import express from 'express';
import http from 'http';
import cloneDeep from 'clone-deep';
import path from 'path';
import config from '../shared/config.json';
import { stringify } from '../shared/lib.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let id = 0;

export interface Tree {
	pos: Vec2,
	daysOld: number
}

export interface SunGlob {
	pos: Vec2,
	sunlight: number,
}

export interface State {
	trees: Tree[],
	sunGlobs: Record<number, SunGlob>,
	sunlight: number
}

const state: State = {
	trees: [],
	sunGlobs: Object.fromEntries([...Array(12)].map((_, i) => {
		return [++id, {
			pos: mulf(50 + Math.random() * 50, rotToVec2(i / 12 * Math.PI * 2)),
			sunlight: 9 + Math.floor(Math.random() * 5)
		}]
	})),
	sunlight: 0
};

// how much sun a tree produces per tick relative to its age
const sunPerYear: number[] = [ 1, 2, 3, 4, 5, 6, 7, 9, 10, 11 ]

const tick = () => {
	const startState = cloneDeep(state);

	for (let i = 0; i < state.trees.length; i++) {
		const tree = state.trees[i];

		if (tree.daysOld >= 730) {
			state.trees.splice(i, 1);
			i--;
			continue;
		}

		tree.daysOld += 6;
		let treeSunlight = sunPerYear[Math.min(
			sunPerYear.length - 1,
			Math.floor(tree.daysOld / 365)
		)];
		if (Math.random() < 0.3) {
			while (treeSunlight) {
				const sunlight = Math.min(treeSunlight, Math.ceil(Math.random() * 4));
				treeSunlight -= sunlight;
				state.sunGlobs[++id] = {
					pos: add(tree.pos, mulf(15 + Math.random()*30, rotToVec2(Math.random() * Math.PI*2))),
					sunlight
				};
			}
		}
	}

	for (const client of wss.clients)
		client.send(stringify({ kind: 'stateDiff', body: diff(startState, state) }));
};
setInterval(tick, 1000);

const app = express();

app.use(express.static(path.join(__dirname, '..', '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
	ws.on('message', (data) => {
		const startState = cloneDeep(state)
		const msg = JSON.parse(data.toString());
		
		switch (msg.kind) {
			case 'placeTree': {
				const pos = msg.body;

				const nearestTreeDist = state
					.trees
					.map(x => dist(x.pos, pos))
					.sort((a, b) => a - b)
					.splice(0, 1)[0] ?? Infinity;

				if (nearestTreeDist > 40 && state.sunlight > 100) {
					state.trees.push({ daysOld: 0, pos });
					state.sunlight -= 100;
				}
				break
			}
			case 'grabGlobsAt': {
				const pos = msg.body;
				for (const [key, sg] of Object.entries(state.sunGlobs)) {
					if (dist(sg.pos, pos) < 40) {
						delete state.sunGlobs[key as unknown as number];
						state.sunlight += sg.sunlight;
					}
				}
				break;
			}
			case 'ready': {
				ws.send(stringify({ kind: 'stateDiff', body: state }));
				break;
			}
		}

		const diffed = diff(startState, state);
		if (Object.keys(diffed).length > 0)
			for (const client of wss.clients)
				client.send(stringify({ kind: 'stateDiff', body: diffed }));
	});
});

const port = parseInt(process.env.PORT ?? '3000', 10);
server.listen(port, () => console.log(`Whee :) http://localhost:${port}`));