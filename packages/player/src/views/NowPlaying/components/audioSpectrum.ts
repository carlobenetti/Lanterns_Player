import range from 'lodash-es/range';

import { audioAnalyser } from '../../../services/audioAnalyser';
import { useSoundStore } from '../../../stores/soundStore';

const MIN_FREQUENCY_HZ = 40;
const MAX_FREQUENCY_HZ = 16000;
const BYTE_MAX = 255;
const LEVEL_CURVE = 1.6;

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
  let data = new Uint8Array(0);

  return (): number[] | null => {
    const isPlaying = useSoundStore.getState().status === 'playing';
    const analyser = isPlaying ? audioAnalyser.get() : null;
    if (!analyser) {
      return null;
    }

    if (data.length !== analyser.frequencyBinCount) {
      data = new Uint8Array(analyser.frequencyBinCount);
      bands = createBands(
        bandCount,
        analyser.context.sampleRate,
        analyser.frequencyBinCount,
      );
    }

    analyser.getByteFrequencyData(data);
    return bands.map(([startBin, endBin]) => {
      let peak = 0;
      for (let bin = startBin; bin < endBin; bin++) {
        peak = Math.max(peak, data[bin]);
      }
      return (peak / BYTE_MAX) ** LEVEL_CURVE;
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
