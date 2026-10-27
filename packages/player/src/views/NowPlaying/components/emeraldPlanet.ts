import type { LanternColors } from './audioSpectrum';
import { EARTH_INLAND_SEAS, EARTH_LAND, type Polygon } from './earthCoastlines';

const MAP_WIDTH = 512;
const MAP_HEIGHT = 256;
const SUPERSAMPLE = 4;
const QUARTER_TURN_DEGREES = 90;
const HALF_TURN_DEGREES = 180;
const FULL_TURN_DEGREES = 360;
const GLOBE_PIXELS = 220;
const AXIAL_TILT_RADIANS = 0.41;
const SECONDS_PER_TURN = 80;
const BYTE_MAX = 255;
const RGBA_CHANNELS = 4;
const PLANET_OPACITY = 0.8;
const GLASS_BODY_ALPHA = 0.08;
const GLASS_EDGE_ALPHA = 0.3;
const GLASS_EDGE_START_RATIO = 0.75;
const FAR_SIDE_LAND_ALPHA = 0.09;
const LAND_ALPHA = 0.9;
const LAND_GLOW_RATIO = 0.06;
const HIGHLIGHT_ALPHA = 0.22;
const HIGHLIGHT_OFFSET_RATIO = 0.42;
const HIGHLIGHT_RADIUS_RATIO = 0.38;
const HIGHLIGHT_COLOR = 'rgba(255, 255, 255, 1)';
const HIGHLIGHT_FADE = 'rgba(255, 255, 255, 0)';
const ATMOSPHERE_RADIUS_RATIO = 1.6;
const ATMOSPHERE_BASE_ALPHA = 0.18;
const ATMOSPHERE_ENERGY_ALPHA = 0.5;
const ATMOSPHERE_INNER_RATIO = 1;
const OCEAN_SHADE = 'rgba(0, 12, 10, 0.55)';
const FULL_TURN = Math.PI * 2;

const fillSpans = (
  cells: Uint8Array,
  polygon: Polygon,
  latitude: number,
  value: number,
) => {
  const crossings: number[] = [];
  polygon.forEach(([fromLongitude, fromLatitude], index) => {
    const [toLongitude, toLatitude] = polygon[(index + 1) % polygon.length];
    if (fromLatitude <= latitude === toLatitude <= latitude) {
      return;
    }
    const amount = (latitude - fromLatitude) / (toLatitude - fromLatitude);
    const longitude = fromLongitude + (toLongitude - fromLongitude) * amount;
    crossings.push(
      ((longitude + HALF_TURN_DEGREES) / FULL_TURN_DEGREES) * cells.length,
    );
  });
  crossings.sort((first, second) => first - second);

  for (let index = 0; index + 1 < crossings.length; index += 2) {
    const start = Math.ceil(crossings[index] - 0.5);
    const end = Math.ceil(crossings[index + 1] - 0.5);
    for (let cell = start; cell < end; cell++) {
      cells[((cell % cells.length) + cells.length) % cells.length] = value;
    }
  }
};

const createLandMap = () => {
  const land = new Float32Array(MAP_WIDTH * MAP_HEIGHT);
  const cells = new Uint8Array(MAP_WIDTH * SUPERSAMPLE);
  const subRowCount = MAP_HEIGHT * SUPERSAMPLE;
  const sampleWeight = 1 / (SUPERSAMPLE * SUPERSAMPLE);

  for (let subRow = 0; subRow < subRowCount; subRow++) {
    const latitude =
      QUARTER_TURN_DEGREES - ((subRow + 0.5) / subRowCount) * HALF_TURN_DEGREES;
    cells.fill(0);
    EARTH_LAND.forEach((polygon) => fillSpans(cells, polygon, latitude, 1));
    EARTH_INLAND_SEAS.forEach((polygon) =>
      fillSpans(cells, polygon, latitude, 0),
    );

    const rowOffset = Math.floor(subRow / SUPERSAMPLE) * MAP_WIDTH;
    cells.forEach((cell, index) => {
      if (cell) {
        land[rowOffset + Math.floor(index / SUPERSAMPLE)] += sampleWeight;
      }
    });
  }
  return land;
};

type GlobePixel = {
  offset: number;
  row: number;
  longitude: number;
  farLongitude: number;
  edge: number;
};

const createGlobePixels = (): GlobePixel[] => {
  const pixels: GlobePixel[] = [];
  const cosTilt = Math.cos(AXIAL_TILT_RADIANS);
  const sinTilt = Math.sin(AXIAL_TILT_RADIANS);
  for (let pixelY = 0; pixelY < GLOBE_PIXELS; pixelY++) {
    for (let pixelX = 0; pixelX < GLOBE_PIXELS; pixelX++) {
      const screenX = ((pixelX + 0.5) / GLOBE_PIXELS) * 2 - 1;
      const screenY = 1 - ((pixelY + 0.5) / GLOBE_PIXELS) * 2;
      const distanceSquared = screenX * screenX + screenY * screenY;
      if (distanceSquared > 1) {
        continue;
      }

      const depth = Math.sqrt(1 - distanceSquared);
      const planetX = screenX * cosTilt + screenY * sinTilt;
      const planetY = screenY * cosTilt - screenX * sinTilt;
      const latitude = Math.asin(planetY);
      const longitude = Math.atan2(planetX, depth) / FULL_TURN + 1;
      pixels.push({
        offset: (pixelY * GLOBE_PIXELS + pixelX) * RGBA_CHANNELS,
        row: Math.min(
          MAP_HEIGHT - 1,
          Math.floor(((Math.PI / 2 - latitude) / Math.PI) * MAP_HEIGHT),
        ),
        longitude,
        farLongitude: Math.atan2(planetX, -depth) / FULL_TURN + 1,
        edge: Math.min(
          1,
          (1 - Math.sqrt(distanceSquared)) * (GLOBE_PIXELS / 2),
        ),
      });
    }
  }
  return pixels;
};

export type PlanetFrame = {
  centerX: number;
  centerY: number;
  radius: number;
  energy: number;
  deltaSeconds: number;
  colors: LanternColors;
};

export const createEmeraldPlanetPainter = () => {
  const globe = document.createElement('canvas');
  globe.width = GLOBE_PIXELS;
  globe.height = GLOBE_PIXELS;
  const globeContext = globe.getContext('2d');
  if (!globeContext) {
    return null;
  }

  const land = createLandMap();
  const pixels = createGlobePixels();
  const image = globeContext.createImageData(GLOBE_PIXELS, GLOBE_PIXELS);
  let rotation = 0;

  return (
    context: CanvasRenderingContext2D,
    { centerX, centerY, radius, energy, deltaSeconds, colors }: PlanetFrame,
  ) => {
    rotation = (rotation + deltaSeconds / SECONDS_PER_TURN) % 1;

    const landAt = (row: number, longitude: number) =>
      land[
        row * MAP_WIDTH +
          (Math.floor(((longitude - rotation + 1) % 1) * MAP_WIDTH) % MAP_WIDTH)
      ];

    pixels.forEach(({ offset, row, longitude, farLongitude, edge }) => {
      const coverage = Math.max(
        landAt(row, longitude),
        landAt(row, farLongitude) * FAR_SIDE_LAND_ALPHA,
      );
      image.data[offset] = BYTE_MAX;
      image.data[offset + 1] = BYTE_MAX;
      image.data[offset + 2] = BYTE_MAX;
      image.data[offset + 3] = coverage * edge * BYTE_MAX;
    });
    globeContext.putImageData(image, 0, 0);
    globeContext.globalCompositeOperation = 'source-in';
    globeContext.fillStyle = colors.core;
    globeContext.fillRect(0, 0, GLOBE_PIXELS, GLOBE_PIXELS);
    globeContext.globalCompositeOperation = 'source-over';

    const atmosphere = context.createRadialGradient(
      centerX,
      centerY,
      radius * ATMOSPHERE_INNER_RATIO,
      centerX,
      centerY,
      radius * ATMOSPHERE_RADIUS_RATIO,
    );
    atmosphere.addColorStop(0, colors.deep);
    atmosphere.addColorStop(1, 'transparent');
    context.globalAlpha =
      PLANET_OPACITY *
      Math.min(1, ATMOSPHERE_BASE_ALPHA + energy * ATMOSPHERE_ENERGY_ALPHA);
    const haloRadius = radius * ATMOSPHERE_RADIUS_RATIO;
    context.save();
    context.beginPath();
    context.rect(
      centerX - haloRadius,
      centerY - haloRadius,
      haloRadius * 2,
      haloRadius * 2,
    );
    context.arc(centerX, centerY, radius, 0, FULL_TURN);
    context.clip('evenodd');
    context.fillStyle = atmosphere;
    context.fillRect(
      centerX - haloRadius,
      centerY - haloRadius,
      haloRadius * 2,
      haloRadius * 2,
    );
    context.restore();

    const diameter = radius * 2;
    const left = centerX - radius;
    const top = centerY - radius;
    context.save();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, FULL_TURN);
    context.clip();

    context.globalAlpha = PLANET_OPACITY;
    context.fillStyle = OCEAN_SHADE;
    context.fillRect(left, top, diameter, diameter);

    context.globalAlpha = PLANET_OPACITY * GLASS_BODY_ALPHA;
    context.fillStyle = colors.deep;
    context.fillRect(left, top, diameter, diameter);

    const glassEdge = context.createRadialGradient(
      centerX,
      centerY,
      radius * GLASS_EDGE_START_RATIO,
      centerX,
      centerY,
      radius,
    );
    glassEdge.addColorStop(0, 'transparent');
    glassEdge.addColorStop(1, colors.core);
    context.globalAlpha = PLANET_OPACITY * GLASS_EDGE_ALPHA;
    context.fillStyle = glassEdge;
    context.fillRect(left, top, diameter, diameter);

    context.shadowColor = colors.core;
    context.shadowBlur = radius * LAND_GLOW_RATIO;
    context.globalAlpha = PLANET_OPACITY * LAND_ALPHA;
    context.drawImage(globe, left, top, diameter, diameter);
    context.shadowBlur = 0;

    const highlightX = centerX - radius * HIGHLIGHT_OFFSET_RATIO;
    const highlightY = centerY - radius * HIGHLIGHT_OFFSET_RATIO;
    const highlight = context.createRadialGradient(
      highlightX,
      highlightY,
      0,
      highlightX,
      highlightY,
      radius * HIGHLIGHT_RADIUS_RATIO,
    );
    highlight.addColorStop(0, HIGHLIGHT_COLOR);
    highlight.addColorStop(1, HIGHLIGHT_FADE);
    context.globalAlpha = PLANET_OPACITY * HIGHLIGHT_ALPHA;
    context.fillStyle = highlight;
    context.fillRect(left, top, diameter, diameter);
    context.restore();
    context.globalAlpha = 1;
  };
};
