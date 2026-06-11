import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { HeatSource, Material, ProbeData } from '@shared/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NearestHeatSourceResult {
  distance: number;
  x: number;
  y: number;
}

export function findNearestHeatSource(
  x: number,
  y: number,
  heatSources: HeatSource[]
): NearestHeatSourceResult {
  if (heatSources.length === 0) {
    return { distance: Infinity, x: -1, y: -1 };
  }

  let minDist = Infinity;
  let nearestX = -1;
  let nearestY = -1;

  for (const source of heatSources) {
    const dist = Math.sqrt(
      Math.pow(x - source.x, 2) + Math.pow(y - source.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearestX = source.x;
      nearestY = source.y;
    }
  }

  return { distance: minDist, x: nearestX, y: nearestY };
}

export function getProbeData(
  x: number,
  y: number,
  temperatureData: number[][],
  maxTemperatureData: number[][],
  materials: Material[],
  materialId: string,
  heatSources: HeatSource[]
): ProbeData | null {
  if (!temperatureData[y] || temperatureData[y][x] === undefined) {
    return null;
  }

  const material = materials.find((m) => m.id === materialId);
  const nearest = findNearestHeatSource(x, y, heatSources);
  const historicalMax = maxTemperatureData[y]?.[x] ?? temperatureData[y][x];

  return {
    x,
    y,
    temperature: temperatureData[y][x],
    materialId,
    materialName: material?.name ?? '未知材料',
    nearestHeatSourceDistance: nearest.distance,
    nearestHeatSourceX: nearest.x,
    nearestHeatSourceY: nearest.y,
    historicalMaxTemp: historicalMax,
  };
}

export function formatTemperature(temp: number): string {
  return `${temp.toFixed(1)}°C`;
}

export function formatDistance(dist: number): string {
  if (dist === Infinity) return '无热源';
  return dist.toFixed(1);
}

export function generateId(): string {
  return `probe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
