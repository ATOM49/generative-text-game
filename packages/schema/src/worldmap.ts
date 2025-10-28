import type { Region } from './region';

export interface WorldMap {
  worldId: string;
  mapImageUrl: string;
  regions: Region[];
  description: string;
}
