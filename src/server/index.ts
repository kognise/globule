import { WebSocketServer, WebSocket } from 'ws';
import { Vec2, dist } from '../shared/vec.js';
import { diff } from 'deep-object-diff';
import express from 'express';
import http from 'http';
import cloneDeep from 'clone-deep';
import path from 'path';
import { ServerInboundMsg, ServerOutboundMsg } from '../shared/msg';
import agents, { AgentConfig, AgentInstance, AgentKind, isInstance } from '../shared/agents.js';
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

export interface Client {
	id: number,
	cursor: Vec2
}

export interface State {
	sunlight: number,
	agents: Record<number, AgentInstance<unknown>>,
	clients: Record<number, Client>,
}

const state: State = {
	// sunGlobs: Object.fromEntries([...Array(8)].map((_, i) => {
	// 	return [++id, {
	// 		pos: mulf(50 + Math.random() * 50, rotToVec2(i / 12 * Math.PI * 2)),
	// 		sunlight: 2 + Math.floor(Math.random() * 4)
	// 	}]
	// })),
	sunlight: 100,
	agents: {},
	clients: {}
};

const send = (ws: WebSocket, msg: ServerOutboundMsg) =>
	ws.send(stringify(msg));

const spawn = (kind: AgentKind, pos: Vec2) => {
	const { initialState } = agents[kind];
	const agent: AgentInstance<unknown> = {
		kind, pos,
		daysOld: 0,
		state: initialState
	};
	state.agents[++id] = agent;
}

const tick = () => {
	const startState = cloneDeep(state);

	for (const [key, i] of Object.entries(state.agents)) {
		i.daysOld += 6;

		const { onTick, onBeforeDestroy } = agents[i.kind] as AgentConfig<unknown>;
		if (onTick) onTick(i, {
			destroy: (destroy) => {
				if (destroy !== false) {
					let reallyDestroy = true
					if (onBeforeDestroy) onBeforeDestroy(i, {
						destroy: (destroy) => reallyDestroy = destroy !== false,
						spawn,
					})
					if (reallyDestroy) delete state.agents[key as any as number];
				}
			},
			spawn
		});
	}
	// for (let i = 0; i < state.trees.length; i++) {
	// 	const tree = state.trees[i];

	// 	if (tree.daysOld >= 730) {
	// 		state.trees.splice(i, 1);
	// 		i--;
	// 		continue;
	// 	}

	// 	tree.daysOld += 6;
	// 	let treeSunlight = sunPerYear[Math.min(
	// 		sunPerYear.length - 1,
	// 		Math.floor(tree.daysOld / 365)
	// 	)];
	// 	if (Math.random() < 0.3) {
	// 		while (treeSunlight) {
	// 			const sunlight = Math.min(treeSunlight, Math.ceil(Math.random() * 4));
	// 			treeSunlight -= sunlight;
	// 			state.sunGlobs[++id] = {
	// 				pos: add(tree.pos, mulf(15 + Math.random()*30, rotToVec2(Math.random() * Math.PI*2))),
	// 				sunlight
	// 			};
	// 		}
	// 	}
	// }

	for (const client of wss.clients)
		send(client, { kind: 'stateDiff', body: diff(startState, state) });
};
setInterval(tick, 1000);

const app = express();

app.use(express.static(path.join(__dirname, '..', '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
	const conn: Client = {
		id: ++id,
		cursor: { x: 0, y: 0 }
	};
	state.clients[conn.id] = conn;

	ws.on('message', (data) => {
		const startState = cloneDeep(state)
		const msg = JSON.parse(data.toString()) as ServerInboundMsg;
		
		switch (msg.kind) {
			case 'spawnAgent': {
				const a = agents[msg.body.kind];
				if (!a.price || a.price > state.sunlight) break;
				
				const isBlocked = Object.values(state.agents)
					.some(({ kind, pos }) => dist(pos, msg.body.pos) < agents[kind].blockRadius);
				if (isBlocked) break;

				const agent: AgentInstance<unknown> = {
					kind: msg.body.kind,
					daysOld: 0,
					pos: msg.body.pos,
					state: a.initialState
				};
				state.agents[++id] = agent;
				state.sunlight -= a.price;
				break;
			}
			case 'cursorAt': {
				conn.cursor = msg.body;
				for (const [key, i] of Object.entries(state.agents)) {
					if (isInstance(i, 'sunlight') && dist(i.pos, msg.body) < 40) {
						delete state.agents[key as unknown as number];
						state.sunlight += i.state.sunlight;
					}
				}
				break;
			}
			case 'ready': {
				send(ws, { kind: 'stateDiff', body: state });
				send(ws, { kind: 'id', body: { id: conn.id } });
				break;
			}
		}

		const diffed = diff(startState, state);
		if (Object.keys(diffed).length > 0)
			for (const client of wss.clients)
				send(client, { kind: 'stateDiff', body: diffed });
	});

	ws.on('close', () => delete state.clients[conn.id])
});

const port = parseInt(process.env.PORT ?? '3000', 10);
server.listen(port, () => console.log(`Whee :) http://localhost:${port}`));
