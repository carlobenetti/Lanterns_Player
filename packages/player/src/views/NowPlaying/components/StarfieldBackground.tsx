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

const STAR_COUNT = 280;
const BAND_COUNT = 16;
const BASS_BAND_COUNT = 4;
const BASS_WEIGHT = 0.65;
const FRAMES_PER_SECOND = 60;
const ENERGY_SMOOTHING_PER_FRAME = 0.1;
const BASE_SPEED_PER_SECOND = 0.05;
const ENERGY_SPEED_PER_SECOND = 1.1;
const STREAK_SECONDS = 0.14;
const MIN_DEPTH = 0.02;
const STAR_MIN_WIDTH = 0.4;
const STAR_MAX_WIDTH = 2.6;
const EDGE_STAR_RATIO = 0.3;
const NEBULA_BASE_ALPHA = 0.08;
const NEBULA_ENERGY_ALPHA = 0.22;
const NEBULA_RADIUS_RATIO = 0.7;
const COLOR_REFRESH_FRAMES = 30;
export const LANTERN_ENERGY_VARIABLE = '--lantern-energy';

type Star = {
  x: number;
  y: number;
  depth: number;
  isEdgeColored: boolean;
};

const spawnStar = (depth: number): Star => ({
  x: Math.random() * 2 - 1,
  y: Math.random() * 2 - 1,
  depth: MIN_DEPTH + depth * (1 - MIN_DEPTH),
  isEdgeColored: Math.random() < EDGE_STAR_RATIO,
});

const createStarfieldDrawer = (): CanvasDrawer => {
  const readSpectrum = createSpectrumReader(BAND_COUNT);
  const stars = range(STAR_COUNT).map(() => spawnStar(Math.random()));
  let energy = 0;
  let colors: LanternColors | null = null;
  let frameCount = 0;

  return ({ canvas, context, width, height, deltaSeconds }) => {
    if (!colors || frameCount % COLOR_REFRESH_FRAMES === 0) {
      colors = readLanternColors(canvas);
    }
    frameCount++;

    const spectrum = readSpectrum();
    const targetEnergy = spectrum
      ? BASS_WEIGHT * mean(spectrum.slice(0, BASS_BAND_COUNT)) +
        (1 - BASS_WEIGHT) * mean(spectrum)
      : 0;
    const smoothing =
      1 -
      (1 - ENERGY_SMOOTHING_PER_FRAME) ** (deltaSeconds * FRAMES_PER_SECOND);
    energy += (targetEnergy - energy) * smoothing;
    canvas.parentElement?.style.setProperty(
      LANTERN_ENERGY_VARIABLE,
      energy.toFixed(3),
    );

    const centerX = width / 2;
    const centerY = height / 2;
    const speed = BASE_SPEED_PER_SECOND + energy * ENERGY_SPEED_PER_SECOND;

    const nebula = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(width, height) * NEBULA_RADIUS_RATIO,
    );
    nebula.addColorStop(0, colors.deep);
    nebula.addColorStop(1, 'transparent');
    context.globalAlpha = NEBULA_BASE_ALPHA + energy * NEBULA_ENERGY_ALPHA;
    context.fillStyle = nebula;
    context.fillRect(0, 0, width, height);

    const { core, edge } = colors;
    context.lineCap = 'round';
    stars.forEach((star, index) => {
      star.depth -= speed * deltaSeconds;
      const tailDepth = star.depth + speed * STREAK_SECONDS;
      const x = centerX + (star.x / star.depth) * centerX;
      const y = centerY + (star.y / star.depth) * centerY;
      const isOffscreen = x < 0 || x > width || y < 0 || y > height;
      if (star.depth <= MIN_DEPTH || isOffscreen) {
        stars[index] = spawnStar(1);
        return;
      }

      const closeness = 1 - star.depth;
      context.globalAlpha = closeness;
      context.strokeStyle = star.isEdgeColored ? edge : core;
      context.lineWidth =
        STAR_MIN_WIDTH + closeness * (STAR_MAX_WIDTH - STAR_MIN_WIDTH);
      context.beginPath();
      context.moveTo(
        centerX + (star.x / tailDepth) * centerX,
        centerY + (star.y / tailDepth) * centerY,
      );
      context.lineTo(x, y);
      context.stroke();
    });
    context.globalAlpha = 1;
  };
};

type StarfieldBackgroundProps = {
  className?: string;
};

export const StarfieldBackground: FC<StarfieldBackgroundProps> = ({
  className,
}) => {
  const canvasRef = useCanvasAnimation(createStarfieldDrawer);

  return (
    <canvas
      ref={canvasRef}
      data-testid="starfield-background"
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 size-full',
        className,
      )}
    />
  );
};
