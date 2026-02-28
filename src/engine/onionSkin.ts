import { clamp } from '../utils';

export type GhostFrame = {
  frame: number;
  opacity: number;
  direction: 'past' | 'future';
};

export const getGhostFrames = (options: {
  frame: number;
  frameCount: number;
  past: number;
  future: number;
}): GhostFrame[] => {
  const frameCount = Math.max(1, Math.floor(options.frameCount));
  const frame = clamp(Math.floor(options.frame), 0, frameCount - 1);
  const past = clamp(Math.floor(options.past), 0, 12);
  const future = clamp(Math.floor(options.future), 0, 12);

  const out: GhostFrame[] = [];

  for (let i = 1; i <= past; i += 1) {
    const f = frame - i;
    if (f < 0) break;
    const opacity = 0.22 * (1 - (i - 1) / Math.max(1, past));
    out.push({ frame: f, opacity, direction: 'past' });
  }

  for (let i = 1; i <= future; i += 1) {
    const f = frame + i;
    if (f > frameCount - 1) break;
    const opacity = 0.18 * (1 - (i - 1) / Math.max(1, future));
    out.push({ frame: f, opacity, direction: 'future' });
  }

  return out;
};

