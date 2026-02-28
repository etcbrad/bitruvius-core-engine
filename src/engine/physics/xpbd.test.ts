import { describe, expect, it } from 'vitest';
import { INITIAL_JOINTS } from '../model';
import type { Joint, Point } from '../types';
import { buildWorldPoseFromJoints, solveXpbd } from './xpbd';
import { stepPosePhysics } from './posePhysics';

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const cloneJoints = (base: Record<string, Joint>): Record<string, Joint> =>
  Object.fromEntries(Object.entries(base).map(([id, j]) => [id, { ...j, baseOffset: { ...j.baseOffset }, currentOffset: { ...j.currentOffset }, targetOffset: { ...j.targetOffset }, previewOffset: { ...j.previewOffset } }]));

describe('engine/physics/xpbd', () => {
  it('maintains rigid bone lengths (distance constraints)', () => {
    const world = {
      a: { x: 0, y: 0 },
      b: { x: 2.2, y: 0.1 },
      c: { x: 4.8, y: -0.3 },
    };
    const constraints = [
      { kind: 'distance' as const, a: 'a', b: 'b', rest: 2, compliance: 0 },
      { kind: 'distance' as const, a: 'b', b: 'c', rest: 2, compliance: 0 },
    ];
    const invMass = { a: 1, b: 1, c: 1 };
    const { world: solved } = solveXpbd(world, constraints, invMass, { iterations: 24, dt: 1 / 60, damping: 0 });

    expect(dist(solved.a, solved.b)).toBeCloseTo(2, 3);
    expect(dist(solved.b, solved.c)).toBeCloseTo(2, 3);
  });

  it('keeps pinned ankle fixed while dragging head (pose physics)', () => {
    const joints = cloneJoints(INITIAL_JOINTS);
    const baseWorld = buildWorldPoseFromJoints(INITIAL_JOINTS, INITIAL_JOINTS, 'preview');
    const pinned = baseWorld.l_ankle;
    expect(pinned).toBeTruthy();
    if (!pinned) return;

    const dragTarget = { x: baseWorld.head.x + 6, y: baseWorld.head.y - 2 };
    const result = stepPosePhysics({
      joints,
      activePins: ['l_ankle'],
      pinTargets: { l_ankle: pinned },
      drag: { id: 'head', target: dragTarget },
      options: { dt: 1 / 60, hardStop: true, autoBend: true, iterations: 18, damping: 0.01 },
    });

    expect(dist(result.world.l_ankle, pinned)).toBeLessThan(1e-2);
    expect(dist(result.world.head, dragTarget)).toBeLessThan(1e-2);
  });

  it('soft wire constraints do not move hard-pinned joints', () => {
    const world = {
      a: { x: 0, y: 0 },
      b: { x: 1, y: 0 },
      c: { x: 0.5, y: 1.2 },
    };
    const constraints = [
      { kind: 'pin' as const, id: 'a', target: { x: 0, y: 0 }, compliance: 0 },
      { kind: 'distance' as const, a: 'a', b: 'b', rest: 1, compliance: 0.01 },
      { kind: 'distance' as const, a: 'a', b: 'c', rest: 1, compliance: 0.01 },
      { kind: 'distance' as const, a: 'b', b: 'c', rest: 1, compliance: 0.01 },
    ];
    const invMass = { a: 0, b: 1, c: 1 };
    const { world: solved } = solveXpbd(world, constraints, invMass, { iterations: 16, dt: 1 / 60, damping: 0 });

    expect(dist(solved.a, { x: 0, y: 0 })).toBeLessThan(1e-6);
  });
});

