import { describe, expect, it } from 'vitest';
import { getGhostFrames } from './onionSkin';

describe('engine/onionSkin', () => {
  it('does not produce negative frames and respects bounds', () => {
    const frames = getGhostFrames({ frame: 0, frameCount: 10, past: 3, future: 2 });
    expect(frames.some((f) => f.frame < 0)).toBe(false);
    expect(frames.some((f) => f.frame > 9)).toBe(false);
    expect(frames.filter((f) => f.direction === 'past').length).toBe(0);
    expect(frames.filter((f) => f.direction === 'future').map((f) => f.frame)).toEqual([1, 2]);
  });

  it('opacities taper with distance', () => {
    const frames = getGhostFrames({ frame: 5, frameCount: 20, past: 3, future: 0 });
    const past = frames.filter((f) => f.direction === 'past');
    expect(past.length).toBe(3);
    expect(past[0].opacity).toBeGreaterThan(past[1].opacity);
    expect(past[1].opacity).toBeGreaterThan(past[2].opacity);
  });
});

