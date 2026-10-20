import mean from 'lodash-es/mean';
import range from 'lodash-es/range';
import { FC } from 'react';

import { cn } from '@nuclearplayer/ui';

import {
  createSpectrumReader,
  readLanternColors,
  type LanternColors,
} from './audioSpectrum';
import { useCanvasAnimation, type CanvasDrawer } from './useCanvasAnimation';

const BAND_COUNT = 40;
const BASS_BAND_COUNT = 6;
const IDLE_LEVEL = 0.03;
const FRAMES_PER_SECOND = 60;
const RELEASE_PER_FRAME = 0.86;
const PEAK_FALL_PER_SECOND = 0.4;
const PEAK_GAP_PX = 6;
const PEAK_RADIUS_RATIO = 0.32;
const HORIZON_RATIO = 0.66;
const UP_REACH_RATIO = 0.94;
const DOWN_REACH_RATIO = 0.85;
const HORIZON_GAP_PX = 3;
const BAR_FILL_RATIO = 0.58;
const BEAM_GLOW_PX = 22;
const REFLECTION_ALPHA = 0.28;
const AURA_BASE_ALPHA = 0.1;
const AURA_ENERGY_ALPHA = 0.45;
const AURA_BASE_RADIUS = 0.22;
const AURA_ENERGY_RADIUS = 0.4;
const HORIZON_BASE_ALPHA = 0.45;
const COLOR_REFRESH_FRAMES = 30;
const SIDES = [1, -1] as const;

const createLanternDrawer = (): CanvasDrawer => {
  const readSpectrum = createSpectrumReader(BAND_COUNT);
  const levels = range(BAND_COUNT).map(() => IDLE_LEVEL);
  const peaks = range(BAND_COUNT).map(() => IDLE_LEVEL);
  let colors: LanternColors | null = null;
  let frameCount = 0;

  return ({ canvas, context, width, height, deltaSeconds }) => {
    if (!colors || frameCount % COLOR_REFRESH_FRAMES === 0) {
      colors = readLanternColors(canvas);
    }
    frameCount++;

    const release = RELEASE_PER_FRAME ** (deltaSeconds * FRAMES_PER_SECOND);
    const incoming = readSpectrum();
    levels.forEach((level, index) => {
      const target = incoming?.[index] ?? 0;
      levels[index] = Math.max(IDLE_LEVEL, target, level * release);
      peaks[index] = Math.max(
        levels[index],
        peaks[index] - PEAK_FALL_PER_SECOND * deltaSeconds,
      );
    });
    const energy = mean(levels.slice(0, BASS_BAND_COUNT));

    const horizon = height * HORIZON_RATIO;
    const centerX = width / 2;
    const slot = width / (BAND_COUNT * 2);
    const barWidth = slot * BAR_FILL_RATIO;
    const barInset = (slot - barWidth) / 2;
    const upReach = horizon * UP_REACH_RATIO;
    const downReach = (height - horizon) * DOWN_REACH_RATIO;
    const barX = (index: number, side: (typeof SIDES)[number]) =>
      side > 0
        ? centerX + index * slot + barInset
        : centerX - index * slot - barInset - barWidth;

    const auraRadius =
      Math.max(width, height) *
      (AURA_BASE_RADIUS + energy * AURA_ENERGY_RADIUS);
    const aura = context.createRadialGradient(
      centerX,
      horizon,
      0,
      centerX,
      horizon,
      auraRadius,
    );
    aura.addColorStop(0, colors.deep);
    aura.addColorStop(1, 'transparent');
    context.globalAlpha = AURA_BASE_ALPHA + energy * AURA_ENERGY_ALPHA;
    context.fillStyle = aura;
    context.fillRect(0, 0, width, height);

    const beams = new Path2D();
    const reflections = new Path2D();
    const peakDots = new Path2D();
    const peakRadius = Math.max(1, barWidth * PEAK_RADIUS_RATIO);
    levels.forEach((level, index) => {
      const up = Math.max(barWidth, level * upReach);
      const down = level * downReach;
      const peakY = horizon - peaks[index] * upReach - PEAK_GAP_PX;
      SIDES.forEach((side) => {
        const x = barX(index, side);
        beams.roundRect(x, horizon - up, barWidth, up, [
          barWidth / 2,
          barWidth / 2,
          0,
          0,
        ]);
        reflections.roundRect(x, horizon + HORIZON_GAP_PX, barWidth, down, [
          0,
          0,
          barWidth / 2,
          barWidth / 2,
        ]);
        peakDots.moveTo(x + barWidth / 2 + peakRadius, peakY);
        peakDots.arc(x + barWidth / 2, peakY, peakRadius, 0, Math.PI * 2);
      });
    });

    const beamGradient = context.createLinearGradient(
      0,
      horizon - upReach,
      0,
      horizon,
    );
    beamGradient.addColorStop(0, colors.edge);
    beamGradient.addColorStop(1, colors.core);
    context.globalAlpha = 1;
    context.shadowColor = colors.core;
    context.shadowBlur = BEAM_GLOW_PX;
    context.fillStyle = beamGradient;
    context.fill(beams);

    context.fillStyle = colors.edge;
    context.fill(peakDots);

    const horizonGradient = context.createLinearGradient(0, 0, width, 0);
    horizonGradient.addColorStop(0, 'transparent');
    horizonGradient.addColorStop(0.5, colors.core);
    horizonGradient.addColorStop(1, 'transparent');
    context.globalAlpha =
      HORIZON_BASE_ALPHA + energy * (1 - HORIZON_BASE_ALPHA);
    context.fillStyle = horizonGradient;
    context.fillRect(0, horizon, width, 1);

    context.shadowBlur = 0;
    const reflectionGradient = context.createLinearGradient(
      0,
      horizon,
      0,
      horizon + downReach,
    );
    reflectionGradient.addColorStop(0, colors.core);
    reflectionGradient.addColorStop(1, 'transparent');
    context.globalAlpha = REFLECTION_ALPHA;
    context.fillStyle = reflectionGradient;
    context.fill(reflections);
    context.globalAlpha = 1;
  };
};

type SpectrumVisualizerProps = {
  className?: string;
};

export const SpectrumVisualizer: FC<SpectrumVisualizerProps> = ({
  className,
}) => {
  const canvasRef = useCanvasAnimation(createLanternDrawer);

  return (
    <canvas
      ref={canvasRef}
      data-testid="spectrum-visualizer"
      aria-hidden
      className={cn('block w-full', className)}
    />
  );
};
