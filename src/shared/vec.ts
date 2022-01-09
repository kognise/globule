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
export const dist = (a: Vec2, b: Vec2) => Math.sqrt(dot(sub(a, b), sub(a, b)));
export const rotToVec2 = (radians: number) => ({ x: Math.cos(radians), y: Math.sin(radians) });