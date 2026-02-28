import { ViewModeId } from '../viewModes';

export interface Point {
  x: number;
  y: number;
}

export interface Joint {
  id: string;
  label: string;
  parent: string | null;
  baseOffset: Point; // Relative to parent
  currentOffset: Point; // Animated offset
  targetOffset: Point; // Intent/Ghost offset
  previewOffset: Point; // Raw Mouse/Ghost Clone offset
  isEndEffector?: boolean;
  mirrorId?: string;
}

export type ControlMode = 'FK' | 'IK' | 'Hybrid';
export type ConnectionType = 'bone' | 'soft_limit' | 'structural_link';
export type BoneShape = 'standard' | 'muscle' | 'tapered' | 'cylinder' | 'wire';

export interface Connection {
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
  shape?: BoneShape;
}

export type TimelineEasingId = 'linear' | 'easeInOut';

export interface EnginePoseSnapshot {
  joints: Record<string, Point>;
}

export interface TimelineKeyframe {
  frame: number;
  pose: EnginePoseSnapshot;
}

export interface TimelineClip {
  frameCount: number;
  fps: number;
  easing: TimelineEasingId;
  keyframes: TimelineKeyframe[];
}

export interface OnionSkinSettings {
  enabled: boolean;
  past: number;
  future: number;
}

export interface TimelineState {
  enabled: boolean;
  clip: TimelineClip;
  onionSkin: OnionSkinSettings;
}

export interface ReferenceLayer {
  src: string | null; // object URL or data URL
  visible: boolean;
  opacity: number; // 0-1
  x: number;
  y: number;
  scale: number;
  fitMode: 'contain' | 'cover' | 'fill' | 'none';
}

export interface HeadMask {
  src: string | null; // object URL or data URL
  visible: boolean;
  opacity: number; // 0-1
  scale: number; // scale factor relative to head size
}

export interface JointMask {
  src: string | null; // object URL or data URL
  visible: boolean;
  opacity: number; // 0-1
  scale: number; // scale factor relative to head length
  offsetX: number; // px offset from joint
  offsetY: number; // px offset from joint
}

export interface SceneState {
  background: ReferenceLayer;
  foreground: ReferenceLayer;
  headMask: HeadMask;
  jointMasks: Record<string, JointMask>;
}

export interface SkeletonState {
  joints: Record<string, Joint>;
  mirroring: boolean;
  bendEnabled: boolean;
  stretchEnabled: boolean;
  leadEnabled: boolean;
  hardStop: boolean;
  activePins: string[];
  viewMode: ViewModeId;
  controlMode: ControlMode;
  snappiness: number;
  timeline: TimelineState;
  scene: SceneState;
}
