import { viewModes, type ViewModeId } from '../viewModes';
import { clamp } from '../utils';
import { INITIAL_JOINTS } from './model';
import type { ControlMode, Joint, JointMask, Point, SkeletonState, ReferenceLayer, HeadMask } from './types';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const safeNumber = (value: unknown, fallback = 0) => (isFiniteNumber(value) ? value : fallback);

const safePoint = (value: unknown, fallback: Point): Point => {
  if (!value || typeof value !== 'object') return { ...fallback };
  const v = value as { x?: unknown; y?: unknown };
  return { x: safeNumber(v.x, fallback.x), y: safeNumber(v.y, fallback.y) };
};

const sanitizeJointMask = (raw: unknown, base: JointMask): JointMask => {
  if (!raw || typeof raw !== 'object') return base;
  const mask = raw as Partial<JointMask>;
  return {
    src: typeof mask.src === 'string' ? mask.src : base.src,
    visible: typeof mask.visible === 'boolean' ? mask.visible : base.visible,
    opacity: isFiniteNumber(mask.opacity) ? clamp(mask.opacity, 0, 1) : base.opacity,
    scale: isFiniteNumber(mask.scale) ? clamp(mask.scale, 0.01, 20) : base.scale,
    offsetX: isFiniteNumber(mask.offsetX) ? clamp(mask.offsetX, -5000, 5000) : base.offsetX,
    offsetY: isFiniteNumber(mask.offsetY) ? clamp(mask.offsetY, -5000, 5000) : base.offsetY,
  };
};

const makeDefaultJointMasks = (): Record<string, JointMask> => {
  const out: Record<string, JointMask> = {};
  for (const id of Object.keys(INITIAL_JOINTS)) {
    out[id] = { src: null, visible: false, opacity: 1.0, scale: 0.25, offsetX: 0, offsetY: 0 };
  }
  return out;
};

const sanitizeReferenceLayer = (raw: unknown, base: ReferenceLayer): ReferenceLayer => {
  if (!raw || typeof raw !== 'object') return base;
  const layer = raw as Partial<ReferenceLayer>;
  const fitMode = layer.fitMode === 'contain' || layer.fitMode === 'cover' || 
                  layer.fitMode === 'fill' || layer.fitMode === 'none' 
                  ? layer.fitMode : base.fitMode;
  
  return {
    src: typeof layer.src === 'string' ? layer.src : base.src,
    visible: typeof layer.visible === 'boolean' ? layer.visible : base.visible,
    opacity: isFiniteNumber(layer.opacity) ? clamp(layer.opacity, 0, 1) : base.opacity,
    x: safeNumber(layer.x, base.x),
    y: safeNumber(layer.y, base.y),
    scale: isFiniteNumber(layer.scale) ? clamp(layer.scale, 0.01, 20) : base.scale,
    fitMode,
  };
};

const sanitizeHeadMask = (raw: unknown, base: HeadMask): HeadMask => {
  if (!raw || typeof raw !== 'object') return base;
  const mask = raw as Partial<HeadMask>;
  
  return {
    src: typeof mask.src === 'string' ? mask.src : base.src,
    visible: typeof mask.visible === 'boolean' ? mask.visible : base.visible,
    opacity: isFiniteNumber(mask.opacity) ? clamp(mask.opacity, 0, 1) : base.opacity,
    scale: isFiniteNumber(mask.scale) ? clamp(mask.scale, 0.01, 20) : base.scale,
  };
};

const VIEW_MODE_ID_SET = new Set<ViewModeId>(viewModes.map((m) => m.id));
const CONTROL_MODE_SET = new Set<ControlMode>(['FK', 'IK', 'Hybrid']);

export const sanitizeJoints = (rawJoints: unknown): Record<string, Joint> => {
  const raw = rawJoints && typeof rawJoints === 'object' ? (rawJoints as Record<string, Partial<Joint>>) : {};
  const next: Record<string, Joint> = {};
  for (const id of Object.keys(INITIAL_JOINTS)) {
    const base = INITIAL_JOINTS[id];
    const saved = raw[id] as Partial<Joint> | undefined;
    next[id] = {
      ...base,
      currentOffset: safePoint(saved?.currentOffset, base.currentOffset),
      targetOffset: safePoint(saved?.targetOffset, base.targetOffset),
      previewOffset: safePoint(saved?.previewOffset ?? saved?.targetOffset, base.previewOffset),
    };
  }
  return next;
};

export const makeDefaultState = (): SkeletonState => ({
  joints: sanitizeJoints(null),
  mirroring: true,
  bendEnabled: true,
  stretchEnabled: false,
  leadEnabled: true,
  hardStop: false,
  activePins: [],
  showJoints: true,
  jointsOverMasks: true,
  viewMode: 'default',
  controlMode: 'Hybrid',
  snappiness: 0.35,
  timeline: {
    enabled: true,
    clip: {
      frameCount: 120,
      fps: 24,
      easing: 'linear',
      keyframes: [],
    },
    onionSkin: {
      enabled: false,
      past: 2,
      future: 2,
    },
  },
	scene: {
    background: {
      src: null,
      visible: false,
      opacity: 1.0,
      x: 0,
      y: 0,
      scale: 1.0,
      fitMode: 'contain',
    },
    foreground: {
      src: null,
      visible: false,
      opacity: 1.0,
      x: 0,
      y: 0,
      scale: 1.0,
      fitMode: 'contain',
    },
	    headMask: {
	      src: null,
	      visible: false,
	      opacity: 1.0,
	      scale: 0.25,
	    },
	    jointMasks: makeDefaultJointMasks(),
	  },
	});

export const sanitizeState = (rawState: unknown): SkeletonState => {
  const base = makeDefaultState();
  if (!rawState || typeof rawState !== 'object') return base;
  const raw = rawState as Partial<SkeletonState> & { [key: string]: unknown };

  const viewMode =
    typeof raw.viewMode === 'string' && VIEW_MODE_ID_SET.has(raw.viewMode as ViewModeId)
      ? (raw.viewMode as ViewModeId)
      : base.viewMode;

  const controlMode =
    typeof raw.controlMode === 'string' && CONTROL_MODE_SET.has(raw.controlMode as ControlMode)
      ? (raw.controlMode as ControlMode)
      : base.controlMode;

  const snappiness = isFiniteNumber(raw.snappiness) ? clamp(raw.snappiness, 0.05, 1.0) : base.snappiness;

  const activePins = Array.isArray(raw.activePins)
    ? Array.from(
        new Set(raw.activePins.filter((id): id is string => typeof id === 'string' && id in INITIAL_JOINTS))
      )
    : base.activePins;

  const rawTimeline =
    raw.timeline && typeof raw.timeline === 'object' ? (raw.timeline as unknown as Record<string, unknown>) : null;
  const rawClip =
    rawTimeline && rawTimeline.clip && typeof rawTimeline.clip === 'object'
      ? (rawTimeline.clip as Record<string, unknown>)
      : null;

  const frameCount = isFiniteNumber(rawClip?.frameCount)
    ? clamp(Math.floor(rawClip!.frameCount), 2, 600)
    : base.timeline.clip.frameCount;
  const fps = isFiniteNumber(rawClip?.fps) ? clamp(Math.floor(rawClip!.fps), 1, 60) : base.timeline.clip.fps;
  const easing =
    rawClip?.easing === 'linear' || rawClip?.easing === 'easeInOut' ? rawClip.easing : base.timeline.clip.easing;

  const sanitizePose = (poseRaw: unknown) => {
    if (!poseRaw || typeof poseRaw !== 'object') return null;
    const rawPose = poseRaw as { joints?: unknown };
    if (!rawPose.joints || typeof rawPose.joints !== 'object') return null;
    const rawJoints = rawPose.joints as Record<string, unknown>;
    const next: Record<string, Point> = {};
    for (const id of Object.keys(INITIAL_JOINTS)) {
      next[id] = safePoint(rawJoints[id], INITIAL_JOINTS[id].previewOffset);
    }
    return { joints: next };
  };

  const rawKeyframes = Array.isArray(rawClip?.keyframes) ? rawClip!.keyframes : [];
  const keyframeByFrame = new Map<number, { frame: number; pose: { joints: Record<string, Point> } }>();
  for (const item of rawKeyframes) {
    if (!item || typeof item !== 'object') continue;
    const rawItem = item as { frame?: unknown; pose?: unknown };
    if (!isFiniteNumber(rawItem.frame)) continue;
    const frame = Math.floor(rawItem.frame);
    if (frame < 0 || frame >= frameCount) continue;
    const pose = sanitizePose(rawItem.pose);
    if (!pose) continue;
    keyframeByFrame.set(frame, { frame, pose });
  }
  const keyframes = Array.from(keyframeByFrame.values()).sort((a, b) => a.frame - b.frame);

  const rawOnion =
    rawTimeline && rawTimeline.onionSkin && typeof rawTimeline.onionSkin === 'object'
      ? (rawTimeline.onionSkin as Record<string, unknown>)
      : null;

  const rawScene = raw.scene && typeof raw.scene === 'object' ? (raw.scene as unknown as Record<string, unknown>) : null;
  const rawJointMasks =
    rawScene?.jointMasks && typeof rawScene.jointMasks === 'object'
      ? (rawScene.jointMasks as Record<string, unknown>)
      : {};
  const jointMasks: Record<string, JointMask> = {};
  for (const id of Object.keys(INITIAL_JOINTS)) {
    jointMasks[id] = sanitizeJointMask(rawJointMasks[id], base.scene.jointMasks[id]);
  }
  
  return {
    joints: sanitizeJoints(raw.joints),
    mirroring: typeof raw.mirroring === 'boolean' ? raw.mirroring : base.mirroring,
    bendEnabled: typeof raw.bendEnabled === 'boolean' ? raw.bendEnabled : base.bendEnabled,
    stretchEnabled: typeof raw.stretchEnabled === 'boolean' ? raw.stretchEnabled : base.stretchEnabled,
    leadEnabled: typeof raw.leadEnabled === 'boolean' ? raw.leadEnabled : base.leadEnabled,
    hardStop: typeof raw.hardStop === 'boolean' ? raw.hardStop : base.hardStop,
    activePins,
    showJoints: typeof raw.showJoints === 'boolean' ? raw.showJoints : base.showJoints,
    jointsOverMasks: typeof raw.jointsOverMasks === 'boolean' ? raw.jointsOverMasks : base.jointsOverMasks,
    viewMode,
    controlMode,
    snappiness,
    timeline: {
      enabled: typeof rawTimeline?.enabled === 'boolean' ? rawTimeline.enabled : base.timeline.enabled,
      clip: {
        frameCount,
        fps,
        easing,
        keyframes,
      },
      onionSkin: {
        enabled: typeof rawOnion?.enabled === 'boolean' ? (rawOnion.enabled as boolean) : base.timeline.onionSkin.enabled,
        past: isFiniteNumber(rawOnion?.past) ? clamp(Math.floor(rawOnion!.past as number), 0, 12) : base.timeline.onionSkin.past,
        future: isFiniteNumber(rawOnion?.future) ? clamp(Math.floor(rawOnion!.future as number), 0, 12) : base.timeline.onionSkin.future,
      },
    },
    scene: {
      background: sanitizeReferenceLayer(rawScene?.background, base.scene.background),
      foreground: sanitizeReferenceLayer(rawScene?.foreground, base.scene.foreground),
      headMask: sanitizeHeadMask(rawScene?.headMask, base.scene.headMask),
      jointMasks,
    },
  };
};
