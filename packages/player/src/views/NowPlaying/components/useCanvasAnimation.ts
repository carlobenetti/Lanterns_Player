import { useEffect, useRef } from 'react';

const MS_PER_SECOND = 1000;
const MAX_FRAME_SECONDS = 0.1;

export type CanvasFrame = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  deltaSeconds: number;
};

export type CanvasDrawer = (frame: CanvasFrame) => void;

export const useCanvasAnimation = (createDrawer: () => CanvasDrawer) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    const draw = createDrawer();
    let frameId = 0;
    let lastTimestamp: number | null = null;

    const render = (timestamp: number) => {
      const deltaSeconds = Math.min(
        MAX_FRAME_SECONDS,
        lastTimestamp === null
          ? 0
          : (timestamp - lastTimestamp) / MS_PER_SECOND,
      );
      lastTimestamp = timestamp;

      const pixelRatio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const pixelWidth = Math.round(width * pixelRatio);
      const pixelHeight = Math.round(height * pixelRatio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      if (width > 0 && height > 0) {
        draw({ canvas, context, width, height, deltaSeconds });
      }
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [createDrawer]);

  return canvasRef;
};
