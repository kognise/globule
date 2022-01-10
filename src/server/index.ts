import { WebSocketServer, WebSocket } from 'ws';
import { Vec2, dist, mulf, rotToVec2, add } from '../shared/vec.js';
import { diff } from 'deep-object-diff';
import express from 'express';
import http from 'http';
import cloneDeep from 'clone-deep';
import path from 'path';
import { ServerInboundMsg, ServerOutboundMsg } from '../shared/msg';
import agents, { AgentActions, AgentConfig, AgentInstance, AgentKind, isInstance } from '../shared/agents.js';
import { applyDiff, msPerTick, stringify } from '../shared/lib.js';
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
	sunlight: 1000,
	agents: Object.fromEntries(new Array(8).fill(null).map((_, i) => [
		++id,
		{
			id,
			kind: 'sunlight',
			ticksOld: 0,
			pos: mulf(50 + Math.random() * 50, rotToVec2(i / 12 * Math.PI * 2)),
			state: { sunlight: 2 + Math.floor(Math.random() * 4) }
		}
	])),
	clients: {}
};

const send = (ws: WebSocket, msg: ServerOutboundMsg) =>
	ws.send(stringify(msg));

const destroyUtil = (id: number, destroy?: boolean) => {
	if (destroy !== false) {
		const i = state.agents[id] as AgentInstance<unknown>;
		const { onBeforeDestroy } = agents[i.kind] as AgentConfig<unknown>;

		let reallyDestroy = true
		if (onBeforeDestroy) onBeforeDestroy(i, {
			destroy: (a) => destroyUtil(i.id, a),
			destroyAgent: (a, b) => destroyUtil(a, b),
			spawn,
			drop: (kind, partialState) => drop(i, kind, partialState)
		}, state)
		if (reallyDestroy) delete state.agents[id];
	}
}

const spawn = (kind: AgentKind, pos: Vec2, partialState?: unknown) => {
	const { initialState, onSpawn, onBeforeDestroy } = agents[kind] as AgentConfig<unknown>;
	const agent: AgentInstance<unknown> = {
		id: ++id,
		kind, pos,
		ticksOld: 0,
		state: partialState ? applyDiff(cloneDeep(initialState), partialState) : cloneDeep(initialState)
	};
	state.agents[agent.id] = agent;
	if (onSpawn) onSpawn(agent, {
		destroy: (a) => destroyUtil(agent.id, a),
		destroyAgent: (a, b) => destroyUtil(a, b),
		spawn,
		drop: (kind, partialState) => drop(agent, kind, partialState)
	}, state);
}

const drop = (i: AgentInstance<unknown>, kind: AgentKind, partialState?: unknown) => {
	const pos = add(i.pos, mulf(15 + Math.random()*30, rotToVec2(Math.random() * Math.PI*2)));
	spawn(kind, pos, partialState);
	return pos;
}

let accumulator = 0;
let lastTime = Date.now();
const tick = () => {
	const startState = cloneDeep(state);

	const now = Date.now();
	accumulator += now - lastTime;
	lastTime = now;

	while (accumulator > msPerTick) {
		accumulator -= msPerTick;
		for (const [key, i] of Object.entries(state.agents)) {
			i.ticksOld++;

			const { onTick, onBeforeDestroy } = agents[i.kind] as AgentConfig<unknown>;
			if (onTick) onTick(i, {
				destroy: (a) => destroyUtil(i.id, a),
				destroyAgent: (a, b) => destroyUtil(a, b),
				spawn,
				drop: (kind, partialState) => drop(i, kind, partialState)
			}, state);
		}
	}

	for (const client of wss.clients)
		send(client, { kind: 'stateDiff', body: diff(startState, state) });
};
setInterval(tick, msPerTick);

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
				const a = agents[msg.body.kind] as AgentConfig<unknown>;
				if (!a.shop || a.shop.price > state.sunlight) break;
				
				const isBlocked = Object.values(state.agents)
					.some(({ pos }) => dist(pos, msg.body.pos) < a.shop!.blockRadius);
				if (isBlocked) break;

				const agent: AgentInstance<unknown> = {
					id: ++id,
					kind: msg.body.kind,
					ticksOld: 0,
					pos: msg.body.pos,
					state: cloneDeep(a.initialState)
				};
				state.agents[agent.id] = agent;
				state.sunlight -= a.shop.price;
				if (a.onSpawn) a.onSpawn(agent, {
					destroy: (a) => destroyUtil(agent.id, a),
					destroyAgent: (a, b) => destroyUtil(a, b),
					spawn,
					drop: (kind, partialState) => drop(agent, kind, partialState)
				}, state)
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
