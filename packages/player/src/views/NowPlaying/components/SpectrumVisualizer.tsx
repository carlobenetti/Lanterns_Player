import range from 'lodash-es/range';
import { FC, useEffect, useRef } from 'react';

import { cn } from '@nuclearplayer/ui';

import { audioAnalyser } from '../../../services/audioAnalyser';
import { useSoundStore } from '../../../stores/soundStore';

const BAR_COUNT = 56;
const MIN_FREQUENCY_HZ = 40;
const MAX_FREQUENCY_HZ = 16000;
const IDLE_LEVEL = 0.04;
const BYTE_MAX = 255;
const LEVEL_CURVE = 1.6;
const IDLE_DECAY = 0.92;
const PEAK_FALL_PER_FRAME = 0.008;
const PEAK_GAP = 0.03;

const barClipPath = (level: number) =>
  `inset(${(1 - level) * 100}% 0 0 0 round 2px 2px 0 0)`;

type BandRange = [startBin: number, endBin: number];

const createBands = (sampleRate: number, binCount: number): BandRange[] => {
  const hzPerBin = sampleRate / 2 / binCount;
  const ratio = MAX_FREQUENCY_HZ / MIN_FREQUENCY_HZ;
  return range(BAR_COUNT).map((index) => {
    const lowHz = MIN_FREQUENCY_HZ * ratio ** (index / BAR_COUNT);
    const highHz = MIN_FREQUENCY_HZ * ratio ** ((index + 1) / BAR_COUNT);
    const startBin = Math.floor(lowHz / hzPerBin);
    const endBin = Math.max(startBin + 1, Math.ceil(highHz / hzPerBin));
    return [startBin, Math.min(endBin, binCount)];
  });
};

const readLevels = (
  analyser: AnalyserNode,
  bands: BandRange[],
  data: Uint8Array<ArrayBuffer>,
) => {
  analyser.getByteFrequencyData(data);
  return bands.map(([startBin, endBin]) => {
    let peak = 0;
    for (let bin = startBin; bin < endBin; bin++) {
      peak = Math.max(peak, data[bin]);
    }
    return Math.max(IDLE_LEVEL, (peak / BYTE_MAX) ** LEVEL_CURVE);
  });
};

type SpectrumVisualizerProps = {
  className?: string;
};

export const SpectrumVisualizer: FC<SpectrumVisualizerProps> = ({
  className,
}) => {
  const barRefs = useRef<Array<HTMLDivElement | null>>([]);
  const peakRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let frameId = 0;
    let bands: BandRange[] = [];
    let data = new Uint8Array(0);
    const levels = range(BAR_COUNT).map(() => IDLE_LEVEL);
    const peaks = range(BAR_COUNT).map(() => IDLE_LEVEL);

    const draw = () => {
      const isPlaying = useSoundStore.getState().status === 'playing';
      const analyser = isPlaying ? audioAnalyser.get() : null;

      if (analyser) {
        if (data.length !== analyser.frequencyBinCount) {
          data = new Uint8Array(analyser.frequencyBinCount);
          bands = createBands(
            analyser.context.sampleRate,
            analyser.frequencyBinCount,
          );
        }
        readLevels(analyser, bands, data).forEach((level, index) => {
          levels[index] = level;
        });
      } else {
        levels.forEach((level, index) => {
          levels[index] = Math.max(IDLE_LEVEL, level * IDLE_DECAY);
        });
      }

      levels.forEach((level, index) => {
        peaks[index] = Math.max(level, peaks[index] - PEAK_FALL_PER_FRAME);
        const bar = barRefs.current[index];
        const peak = peakRefs.current[index];
        if (bar) {
          bar.style.clipPath = barClipPath(level);
        }
        if (peak) {
          peak.style.bottom = `${Math.min(1, peaks[index] + PEAK_GAP) * 100}%`;
        }
      });

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      data-testid="spectrum-visualizer"
      aria-hidden
      className={cn('flex h-32 w-full items-end gap-[3px]', className)}
    >
      {range(BAR_COUNT).map((index) => (
        <div key={index} className="relative h-full flex-1">
          <div
            ref={(element) => {
              barRefs.current[index] = element;
            }}
            data-testid="spectrum-bar"
            className="from-accent-green to-accent-cyan absolute inset-0 bg-linear-to-t"
            style={{ clipPath: barClipPath(IDLE_LEVEL) }}
          />
          <div
            ref={(element) => {
              peakRefs.current[index] = element;
            }}
            className="bg-foreground/70 absolute inset-x-0 h-[2px] rounded-full"
            style={{ bottom: `${(IDLE_LEVEL + PEAK_GAP) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
};
