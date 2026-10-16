import { ScriptHTMLAttributes } from 'react';

export type AudioSource = {
  url: string;
  protocol: 'file' | 'http' | 'https';
  startPositionSeconds?: number;
};

export type SoundStatus = 'playing' | 'paused' | 'stopped';
export type SoundProps = {
  src: AudioSource;
  status: SoundStatus;
  seek?: number;
  volume?: number;
  preload?: HTMLAudioElement['preload'];
  crossOrigin?: ScriptHTMLAttributes<HTMLAudioElement>['crossOrigin'];
  onTimeUpdate?: (args: { position: number; duration: number }) => void;
  onEnd?: () => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: Error) => void;
  onAudioElement?: (element: HTMLAudioElement | null) => void;
};
