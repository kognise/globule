import { Vec2 } from '../shared/vec.js';
import { fillCircle, realMod } from '../shared/lib.js'
import { State } from './script.js';
import agents, { AgentConfig, AgentKind } from '../shared/agents.js';

const dirt = Object.assign(new Image(), { src: 'textures/dirt-shit.png' });

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const xyInBox = ({ x, y }: Vec2, { x: bx, y: by }: Vec2, bw: number, bh: number) =>
	x >= bx && x <= (bx + bw) &&
	y >= by && y <= (by + bh);

const mouse: Vec2 = { x: 0, y: 0 };

const rotationMatrix = [
	[1, 0, 1, 3, 3, 1, 1, 0, 1, 2, 3, 1, 2, 0, 1, 1, 0, 2, 1, 3, 2, 1, 3, 2, 1, 2, 0, 3, 1, 0, 3, 2],
	[1, 2, 1, 0, 2, 0, 2, 3, 2, 0, 2, 1, 3, 2, 3, 2, 2, 1, 1, 2, 0, 2, 1, 0, 1, 3, 1, 2, 2, 1, 1, 2],
	[0, 3, 2, 2, 1, 2, 2, 2, 1, 1, 2, 1, 1, 0, 1, 1, 2, 3, 0, 3, 1, 2, 1, 3, 2, 2, 0, 1, 2, 3, 3, 1],
	[2, 0, 3, 1, 1, 3, 0, 0, 1, 2, 3, 0, 2, 2, 3, 0, 1, 2, 1, 2, 0, 3, 1, 2, 0, 1, 2, 3, 1, 0, 1, 2],
	[2, 1, 1, 3, 2, 1, 1, 3, 3, 1, 0, 3, 1, 2, 1, 2, 1, 0, 3, 2, 1, 1, 2, 0, 2, 1, 1, 2, 2, 1, 0, 2],
	[1, 0, 2, 1, 0, 2, 2, 1, 2, 2, 2, 1, 1, 2, 1, 3, 3, 1, 2, 1, 3, 2, 0, 3, 2, 3, 0, 2, 0, 3, 1, 3],
	[2, 2, 0, 3, 2, 2, 1, 0, 1, 0, 3, 2, 0, 2, 0, 2, 2, 1, 0, 2, 0, 1, 1, 2, 1, 1, 3, 1, 1, 2, 2, 1],
	[1, 3, 2, 2, 0, 1, 3, 3, 2, 2, 1, 2, 3, 1, 3, 1, 1, 0, 2, 3, 1, 3, 2, 1, 0, 2, 1, 2, 3, 1, 0, 3],
	[1, 0, 1, 1, 1, 2, 1, 0, 2, 1, 0, 1, 1, 2, 1, 0, 2, 3, 2, 1, 1, 0, 2, 3, 3, 2, 0, 1, 2, 0, 1, 2],
	[2, 2, 2, 3, 3, 2, 0, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 1, 0, 2, 2, 1, 1, 0, 1, 2, 3, 2, 2, 2, 3],
	[0, 1, 0, 1, 0, 2, 1, 2, 1, 0, 3, 2, 1, 0, 0, 2, 1, 2, 1, 3, 2, 3, 1, 2, 2, 1, 1, 1, 0, 1, 1, 1],
	[1, 2, 3, 2, 1, 2, 2, 3, 1, 2, 1, 0, 2, 3, 1, 3, 1, 2, 0, 2, 0, 1, 2, 0, 1, 3, 2, 2, 0, 2, 3, 2],
	[2, 1, 2, 1, 3, 0, 1, 0, 2, 3, 1, 1, 2, 2, 1, 2, 0, 3, 2, 1, 1, 2, 1, 3, 2, 1, 0, 2, 3, 1, 0, 2],
	[1, 3, 0, 1, 2, 1, 2, 1, 0, 2, 2, 0, 3, 1, 2, 1, 2, 1, 2, 1, 3, 0, 2, 0, 1, 2, 1, 3, 1, 1, 1, 3],
	[1, 2, 0, 2, 2, 1, 3, 3, 1, 1, 3, 2, 1, 1, 0, 3, 2, 0, 2, 0, 3, 1, 2, 3, 1, 1, 2, 0, 2, 2, 2, 0],
	[1, 3, 2, 3, 2, 0, 1, 2, 2, 1, 0, 1, 3, 2, 1, 0, 2, 1, 3, 1, 2, 1, 1, 2, 2, 2, 3, 0, 1, 3, 2, 1],
	[2, 1, 0, 1, 1, 2, 1, 0, 2, 1, 3, 2, 2, 1, 2, 3, 2, 1, 0, 1, 2, 3, 1, 0, 0, 1, 2, 1, 1, 1, 0, 3],
	[2, 2, 1, 2, 3, 1, 3, 2, 2, 3, 0, 1, 0, 2, 0, 1, 2, 1, 3, 2, 0, 2, 3, 2, 1, 3, 1, 2, 3, 2, 2, 1],
	[3, 1, 0, 2, 0, 1, 2, 0, 1, 1, 2, 2, 1, 3, 1, 3, 0, 2, 2, 1, 1, 0, 2, 1, 2, 2, 1, 0, 2, 2, 1, 0],
	[2, 1, 3, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 2, 1, 2, 0, 1, 3, 2, 2, 0, 1, 3, 0, 2, 0, 1, 0, 2, 1],
	[0, 1, 1, 2, 0, 1, 2, 3, 0, 2, 0, 1, 3, 0, 2, 1, 2, 2, 3, 1, 0, 3, 2, 1, 1, 3, 1, 3, 2, 1, 3, 3],
	[1, 3, 2, 0, 2, 1, 2, 2, 1, 1, 3, 2, 1, 0, 2, 3, 0, 1, 1, 2, 1, 1, 3, 2, 0, 2, 1, 1, 2, 2, 0, 2],
	[2, 2, 0, 3, 2, 1, 0, 2, 1, 2, 2, 0, 2, 2, 1, 2, 1, 2, 0, 2, 3, 2, 1, 2, 1, 2, 2, 0, 3, 1, 1, 2],
	[0, 2, 1, 1, 3, 3, 0, 1, 3, 0, 3, 1, 1, 3, 1, 3, 1, 3, 2, 1, 0, 2, 0, 3, 0, 3, 1, 2, 0, 1, 2, 1],
	[3, 1, 1, 2, 0, 1, 2, 2, 1, 1, 2, 0, 1, 2, 0, 2, 0, 2, 1, 2, 3, 1, 1, 2, 1, 1, 3, 1, 2, 3, 0, 1],
	[2, 1, 3, 2, 1, 2, 2, 0, 2, 1, 2, 3, 3, 2, 1, 0, 1, 1, 3, 1, 2, 1, 3, 2, 1, 2, 0, 2, 1, 1, 2, 3],
	[2, 0, 2, 0, 2, 1, 3, 1, 3, 2, 0, 2, 1, 0, 3, 2, 2, 2, 0, 0, 2, 1, 2, 0, 2, 3, 2, 0, 2, 2, 1, 0],
	[2, 1, 2, 1, 3, 1, 2, 0, 1, 2, 1, 1, 1, 2, 2, 1, 1, 2, 3, 1, 2, 3, 0, 1, 2, 1, 1, 1, 3, 2, 0, 3],
	[2, 1, 3, 0, 1, 2, 3, 1, 1, 3, 0, 3, 1, 2, 1, 0, 3, 0, 1, 2, 1, 2, 1, 3, 0, 1, 2, 2, 0, 1, 1, 1],
	[0, 1, 3, 2, 1, 2, 1, 0, 2, 2, 1, 2, 3, 0, 3, 1, 2, 2, 1, 3, 0, 1, 2, 1, 3, 2, 3, 1, 3, 2, 1, 3],
	[0, 2, 1, 2, 0, 0, 2, 3, 1, 3, 1, 0, 2, 1, 2, 2, 1, 0, 1, 2, 1, 3, 2, 0, 1, 2, 0, 1, 2, 2, 2, 1],
	[3, 2, 1, 2, 1, 3, 2, 1, 2, 0, 2, 1, 2, 1, 0, 3, 3, 1, 2, 2, 0, 1, 2, 0, 3, 1, 2, 1, 2, 0, 1, 2]
];

export const init = (element: HTMLCanvasElement) => {
	canvas = element;
	ctx = canvas.getContext('2d')!;

	window.addEventListener('mousemove', ev => {
		mouse.x = ev.pageX;
		mouse.y = ev.pageY;
	}, { passive: true });

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}, { passive: true });
	window.dispatchEvent(new UIEvent('resize'));
}

let buttonFrame = 0;
const buttonRegistry: Record<string, number> = {};
const renderButton = (id: string, x: number, y: number, text: string, onClick: () => void, classes?: string[]) => {
	if (buttonRegistry[id] !== undefined) {
		const button = document.getElementById(id)!;
		button.className = classes ? classes.join(' ') : '';
		button.style.left = `${x}px`;
		button.style.top = `${y}px`;
		if (button.innerText !== text) button.innerText = text;
		button.onclick = onClick;
	} else {
		const button = document.createElement('button')!;
		if (classes) button.className = classes.join(' ');
		button.id = id;
		button.style.left = `${x}px`;
		button.style.top = `${y}px`;
		button.innerText = text;
		button.onclick = onClick;
		document.body.appendChild(button);
	}
	buttonRegistry[id] = buttonFrame;
}
const endButtonFrame = () => {
	for (const [id, lastRender] of Object.entries(buttonRegistry)) {
		if (lastRender !== buttonFrame) {
			document.getElementById(id)!.remove();
			delete buttonRegistry[id];
		}
	}
	buttonFrame++;
}

let prevElapsed: number;
export const frame = (state: State, elapsed: number) => {
	const { pan, id, srv } = state;
	const delta = elapsed - prevElapsed;
	const renders = [];
	
	for (const i of Object.values(srv.agents)) {
		i.daysOld += delta * (6/1000);
		renders.push({
			zIndex: i.pos.y,
			render() {
				(agents[i.kind] as AgentConfig<unknown>).draw(ctx, i, elapsed);
			}
		});
	}
	
	for (const { cursor, id: clientId } of Object.values(srv.clients)) {
		if (clientId === id) {
			renders.push({
				zIndex: Infinity, render() {
					ctx.fillStyle = 'rgba(121,80,242,0.3)';
					fillCircle(ctx, mouse.x + pan.x - 15, mouse.y + pan.y - 15, 30);
				}
			});
		} else {
			renders.push({
				zIndex: Infinity, render() {
					ctx.fillStyle = 'rgba(255,255,255,0.2)';
					fillCircle(ctx, cursor.x - 10, cursor.y - 10, 20);
				}
			});
		}
	}

	ctx.save();
	ctx.translate(-pan.x, -pan.y);
	const tileSize = 128;
	for (let qx = 0; qx < Math.ceil(window.innerWidth / tileSize) + 2; qx++) {
		for (let qy = 0; qy < Math.ceil(window.innerHeight / tileSize) + 2; qy++) {
			const realTileSize = tileSize + 2;
			const x = (Math.floor(pan.x / tileSize) + qx);
			const y = (Math.floor(pan.y / tileSize) + qy);
			const ix = x * tileSize - 1;
			const iy = y * tileSize - 1;
			const rotation = [ 0, 90, 180, 270 ][rotationMatrix[realMod(x, 32)][realMod(y, 32)]];

			ctx.save();
			ctx.translate(ix + realTileSize/2, iy + realTileSize/2);
			ctx.rotate(rotation / 180 * Math.PI);
			ctx.drawImage(dirt, -realTileSize/2, -realTileSize/2, realTileSize, realTileSize);
			ctx.restore();
		}
	}
	
	renders.sort((a, b) => a.zIndex - b.zIndex);
	renders.forEach(x => x.render());
	ctx.restore();

	ctx.textBaseline = "top";
	ctx.fillStyle = ctx.strokeStyle = 'rgb(240, 210, 200)';
	ctx.lineWidth = 1;
	ctx.font = '36px sans-serif';
	ctx.fillText('☀️ ' + srv.sunlight, 0, 10);

	const mojis: Record<string, string> = {
		sprout: '🌳️'
	};

	let down = 18;
	for (const [key, a] of Object.entries(agents)) {
		if (a.price === undefined) continue;
		down += 40;

		renderButton(
			key, 20, down,
			mojis[key] + ' buy: ' + '☀️' + a.price,
			() => state.selected = key as AgentKind,
			state.selected === key ? [ 'buy', 'selected' ] : [ 'buy' ]
		);
	}

	endButtonFrame();
	prevElapsed = elapsed;
}
