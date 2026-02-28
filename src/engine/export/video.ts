import { sampleClipPose } from '../timeline';
import { getWorldPositionFromOffsets } from '../kinematics';
import type { Connection, EnginePoseSnapshot, Joint, SceneState, TimelineState } from '../types';

export interface VideoExportOptions {
  width: number;
  height: number;
  backgroundColor?: string;
  fps?: number;
  scale?: number;
}

export type VideoExportArgs = VideoExportOptions & {
  timeline: TimelineState;
  baseJoints: Record<string, Joint>;
  connections: Connection[];
  scene: SceneState;
  activePins: string[];
  stretchEnabled: boolean;
  fallbackPose?: EnginePoseSnapshot;
};

const clampInt = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.floor(value)));

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  const img = new Image();
  img.decoding = 'async';
  return await new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

const drawReferenceLayer = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  layer: SceneState['background'],
  options: { width: number; height: number },
) => {
  const boxX = layer.x;
  const boxY = layer.y;
  const boxW = options.width * layer.scale;
  const boxH = options.height * layer.scale;

  const iw = Math.max(1, img.naturalWidth);
  const ih = Math.max(1, img.naturalHeight);

  let drawW = boxW;
  let drawH = boxH;
  let drawX = boxX;
  let drawY = boxY;

  if (layer.fitMode === 'contain' || layer.fitMode === 'cover') {
    const s = layer.fitMode === 'contain' ? Math.min(boxW / iw, boxH / ih) : Math.max(boxW / iw, boxH / ih);
    drawW = iw * s;
    drawH = ih * s;
    drawX = boxX + (boxW - drawW) / 2;
    drawY = boxY + (boxH - drawH) / 2;
  }

  ctx.globalAlpha = layer.opacity;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.globalAlpha = 1;
};

const pickMimeType = (): string | undefined => {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
};

export const exportAsWebm = async (args: VideoExportArgs): Promise<void> => {
  const {
    width,
    height,
    backgroundColor = '#0a0a0a',
    fps: fpsRaw,
    scale = 1,
    timeline,
    baseJoints,
    connections,
    scene,
    activePins,
    stretchEnabled,
    fallbackPose,
  } = args;

  if (!timeline.enabled) throw new Error('Timeline must be enabled to export video');

  const fps = clampInt(fpsRaw ?? timeline.clip.fps, 1, 60);
  const frameCount = clampInt(timeline.clip.frameCount, 2, 600);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');

  const backgroundImg =
    scene.background.src && scene.background.visible ? await loadImage(scene.background.src) : null;
  const foregroundImg =
    scene.foreground.src && scene.foreground.visible ? await loadImage(scene.foreground.src) : null;

  const stream = canvas.captureStream(fps);
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };

  const mimeType = pickMimeType();
  const mediaRecorder = new MediaRecorder(
    stream,
    mimeType
      ? {
          mimeType,
          videoBitsPerSecond: 5_000_000,
        }
      : {
          videoBitsPerSecond: 5_000_000,
        },
  );

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const lines: Array<{ from: string; to: string; type: Connection['type'] }> = [];
  for (const c of connections) lines.push({ from: c.from, to: c.to, type: c.type });
  for (const id of Object.keys(baseJoints)) {
    const j = baseJoints[id];
    if (!j.parent) continue;
    if (id.includes('nipple')) continue;
    const exists = connections.some((c) => (c.from === j.parent && c.to === id) || (c.from === id && c.to === j.parent));
    if (exists) continue;
    lines.push({ from: j.parent, to: id, type: 'bone' });
  }

  const unitScale = 20 * scale;
  const centerX = (width * scale) / 2;
  const centerY = (height * scale) / 2;

  const drawFrame = (pose: EnginePoseSnapshot) => {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (backgroundImg && scene.background.visible) {
      drawReferenceLayer(ctx, backgroundImg, scene.background, { width: width * scale, height: height * scale });
    }

    // Bones
    for (const ln of lines) {
      const a = getWorldPositionFromOffsets(ln.from, pose.joints, baseJoints);
      const b = getWorldPositionFromOffsets(ln.to, pose.joints, baseJoints);
      const x1 = a.x * unitScale + centerX;
      const y1 = a.y * unitScale + centerY;
      const x2 = b.x * unitScale + centerX;
      const y2 = b.y * unitScale + centerY;
      if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) continue;

      ctx.save();
      if (ln.type === 'structural_link') {
        ctx.strokeStyle = 'rgba(224, 224, 224, 0.25)';
        ctx.lineWidth = 1.5 * scale;
      } else if (ln.type === 'soft_limit') {
        ctx.strokeStyle = 'rgba(224, 224, 224, 0.45)';
        ctx.lineWidth = 2 * scale;
        ctx.setLineDash([3 * scale, 3 * scale]);
      } else {
        ctx.strokeStyle = 'rgba(224, 224, 224, 0.9)';
        ctx.lineWidth = 4 * scale;
      }
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    // Joints
    for (const id of Object.keys(baseJoints)) {
      const j = baseJoints[id];
      const p = getWorldPositionFromOffsets(id, pose.joints, baseJoints);
      const x = p.x * unitScale + centerX;
      const y = p.y * unitScale + centerY;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

      const isRoot = !j.parent;
      const r = (isRoot ? 6 : 4) * scale;
      const pinned = activePins.includes(id);
      ctx.fillStyle = isRoot ? 'rgba(255,255,255,1)' : pinned ? 'rgba(255, 0, 102, 1)' : 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (foregroundImg && scene.foreground.visible) {
      drawReferenceLayer(ctx, foregroundImg, scene.foreground, { width: width * scale, height: height * scale });
    }
  };

  await new Promise<void>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `bitruvius-animation-${timestamp}.webm`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    };
    mediaRecorder.onerror = () => reject(new Error('MediaRecorder error'));

    mediaRecorder.start(100);

    (async () => {
      for (let frame = 0; frame < frameCount; frame += 1) {
        const pose =
          sampleClipPose(timeline.clip, frame, baseJoints, { stretchEnabled }) ?? fallbackPose ?? null;
        if (pose) drawFrame(pose);
        track.requestFrame?.();
        await new Promise((r) => setTimeout(r, Math.round(1000 / fps)));
      }
      mediaRecorder.stop();
    })().catch(reject);
  });
};
