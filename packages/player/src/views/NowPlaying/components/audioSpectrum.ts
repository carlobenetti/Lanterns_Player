import range from 'lodash-es/range';

import { audioAnalyser } from '../../../services/audioAnalyser';
import { useSoundStore } from '../../../stores/soundStore';

const MIN_FREQUENCY_HZ = 40;
const MAX_FREQUENCY_HZ = 16000;
const FLOOR_DB = -100;
const REFERENCE_DB = -30;
const LEVEL_CURVE = 1.6;
const SOFT_KNEE = 0.7;

const softLimit = (value: number) =>
  value <= SOFT_KNEE
    ? value
    : SOFT_KNEE +
      (1 - SOFT_KNEE) * Math.tanh((value - SOFT_KNEE) / (1 - SOFT_KNEE));

const decibelsToLevel = (decibels: number) => {
  const linear = Math.max(0, (decibels - FLOOR_DB) / (REFERENCE_DB - FLOOR_DB));
  return softLimit(linear ** LEVEL_CURVE);
};

type BandRange = [startBin: number, endBin: number];

const createBands = (
  bandCount: number,
  sampleRate: number,
  binCount: number,
): BandRange[] => {
  const hzPerBin = sampleRate / 2 / binCount;
  const ratio = MAX_FREQUENCY_HZ / MIN_FREQUENCY_HZ;
  return range(bandCount).map((index) => {
    const lowHz = MIN_FREQUENCY_HZ * ratio ** (index / bandCount);
    const highHz = MIN_FREQUENCY_HZ * ratio ** ((index + 1) / bandCount);
    const startBin = Math.floor(lowHz / hzPerBin);
    const endBin = Math.max(startBin + 1, Math.ceil(highHz / hzPerBin));
    return [startBin, Math.min(endBin, binCount)];
  });
};

export const createSpectrumReader = (bandCount: number) => {
  let bands: BandRange[] = [];
  let data = new Float32Array(0);

  return (): number[] | null => {
    const isPlaying = useSoundStore.getState().status === 'playing';
    const analyser = isPlaying ? audioAnalyser.get() : null;
    if (!analyser) {
      return null;
    }

    if (data.length !== analyser.frequencyBinCount) {
      data = new Float32Array(analyser.frequencyBinCount);
      bands = createBands(
        bandCount,
        analyser.context.sampleRate,
        analyser.frequencyBinCount,
      );
    }

    analyser.getFloatFrequencyData(data);
    return bands.map(([startBin, endBin]) => {
      let peak = -Infinity;
      for (let bin = startBin; bin < endBin; bin++) {
        peak = Math.max(peak, data[bin]);
      }
      return decibelsToLevel(peak);
    });
  };
};

export const readLanternColors = (element: Element) => {
  const style = getComputedStyle(element);
  return {
    core: style.getPropertyValue('--accent-green').trim() || '#b4f5b4',
    edge: style.getPropertyValue('--accent-cyan').trim() || '#a8ecf0',
    deep: style.getPropertyValue('--primary').trim() || '#3fc380',
  };
};

export type LanternColors = ReturnType<typeof readLanternColors>;
