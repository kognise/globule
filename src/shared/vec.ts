export interface Vec2 { x: number, y: number }
export const sub = (a: Vec2, b: Vec2) => ({ x: a.x - b.x, y: a.y - b.y });
export const add = (a: Vec2, b: Vec2) => ({ x: a.x + b.x, y: a.y + b.y });
export const mul = (a: Vec2, b: Vec2) => ({ x: a.x * b.x, y: a.y * b.y });
export const div = (a: Vec2, b: Vec2) => ({ x: a.x / b.x, y: a.y / b.y });
export const subf = (f: number, a: Vec2) => ({ x: a.x - f, y: a.y - f });
export const addf = (f: number, a: Vec2) => ({ x: a.x + f, y: a.y + f });
export const mulf = (f: number, a: Vec2) => ({ x: a.x * f, y: a.y * f });
export const divf = (f: number, a: Vec2) => ({ x: a.x / f, y: a.y / f });
export const dot = (a: Vec2, b: Vec2) => a.x*b.x + a.y*b.y;
export const mag = (a: Vec2) => Math.sqrt(dot(a, a));
export const dist = (a: Vec2, b: Vec2) => mag(sub(a, b));
export const norm = (a: Vec2) => divf(mag(a), a);
export const lerp = (a: Vec2, b: Vec2, t: number) => add(mulf(1 - t, a), mulf(t, b));
export const eq = (a: Vec2, b: Vec2) => a.x === b.x && a.y === b.y;
export const rotToVec2 = (radians: number) => ({ x: Math.cos(radians), y: Math.sin(radians) });