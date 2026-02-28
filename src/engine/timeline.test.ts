import { describe, expect, it } from 'vitest';
import { sampleClipPose } from './timeline';
import type { Joint, TimelineClip } from './types';

const makeJoint = (partial: Partial<Joint> & Pick<Joint, 'id' | 'label' | 'parent' | 'baseOffset'>): Joint => ({
  id: partial.id,
  label: partial.label,
  parent: partial.parent,
  baseOffset: partial.baseOffset,
  currentOffset: partial.currentOffset ?? { ...partial.baseOffset },
  targetOffset: partial.targetOffset ?? { ...partial.baseOffset },
  previewOffset: partial.previewOffset ?? { ...partial.baseOffset },
  isEndEffector: partial.isEndEffector,
  mirrorId: partial.mirrorId,
});

const degToVec = (deg: number, len: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * len, y: Math.sin(rad) * len };
};

describe('engine/timeline', () => {
  it('interpolates angles via shortest path (wrap-safe)', () => {
    const baseJoints: Record<string, Joint> = {
      root: makeJoint({ id: 'root', label: 'Root', parent: null, baseOffset: { x: 0, y: 0 } }),
      bone: makeJoint({ id: 'bone', label: 'Bone', parent: 'root', baseOffset: { x: 1, y: 0 } }),
    };

    const clip: TimelineClip = {
      frameCount: 11,
      fps: 24,
      easing: 'linear',
      keyframes: [
        { frame: 0, pose: { joints: { root: { x: 0, y: 0 }, bone: degToVec(179, 1) } } },
        { frame: 10, pose: { joints: { root: { x: 0, y: 0 }, bone: degToVec(-179, 1) } } },
      ],
    };

    const pose = sampleClipPose(clip, 5, baseJoints);
    expect(pose).not.toBeNull();
    if (!pose) return;

    // Midpoint should be near 180° (vector near (-1, 0)), not near 0°.
    expect(pose.joints.bone.x).toBeLessThan(-0.98);
    expect(Math.abs(pose.joints.bone.y)).toBeLessThan(0.1);
  });

  it('lerps root translation linearly', () => {
    const baseJoints: Record<string, Joint> = {
      root: makeJoint({ id: 'root', label: 'Root', parent: null, baseOffset: { x: 0, y: 0 } }),
    };

    const clip: TimelineClip = {
      frameCount: 3,
      fps: 24,
      easing: 'linear',
      keyframes: [
        { frame: 0, pose: { joints: { root: { x: 0, y: 0 } } } },
        { frame: 2, pose: { joints: { root: { x: 10, y: 0 } } } },
      ],
    };

    const pose = sampleClipPose(clip, 1, baseJoints);
    expect(pose).not.toBeNull();
    if (!pose) return;
    expect(pose.joints.root.x).toBeCloseTo(5, 6);
    expect(pose.joints.root.y).toBeCloseTo(0, 6);
  });
});

