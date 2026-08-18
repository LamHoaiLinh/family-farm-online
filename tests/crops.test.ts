import { describe,it,expect } from 'vitest';
import { CROPS } from '../src/config/crops';
describe('crop config',()=>{it('có đúng 20 cây và id duy nhất',()=>{expect(CROPS).toHaveLength(20);expect(new Set(CROPS.map(c=>c.id)).size).toBe(20)});it('mọi cây có thời gian và giá dương',()=>{for(const c of CROPS){expect(c.growMinutes).toBeGreaterThan(0);expect(c.seedCost).toBeGreaterThan(0);expect(c.baseYield).toBeGreaterThan(0)}})});
