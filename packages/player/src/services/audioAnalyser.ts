const FFT_SIZE = 4096;
const SMOOTHING = 0.75;

let audioElement: HTMLAudioElement | null = null;
let context: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
const connectedElements = new WeakSet<HTMLAudioElement>();

const connect = (element: HTMLAudioElement) => {
  if (!context || !analyser || connectedElements.has(element)) {
    return;
  }
  context.createMediaElementSource(element).connect(analyser);
  connectedElements.add(element);
};

const resume = () => {
  if (context?.state === 'suspended') {
    void context.resume();
  }
};

export const audioAnalyser = {
  attach(element: HTMLAudioElement | null) {
    audioElement = element;
    if (element) {
      connect(element);
    }
  },

  resume,

  get(): AnalyserNode | null {
    if (!audioElement || typeof AudioContext === 'undefined') {
      return null;
    }
    if (!context) {
      context = new AudioContext({ latencyHint: 'playback' });
      analyser = context.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;
      analyser.connect(context.destination);
    }
    connect(audioElement);
    resume();
    return analyser;
  },
};
