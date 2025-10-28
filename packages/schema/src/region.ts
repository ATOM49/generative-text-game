import { z } from 'zod';

export interface Region {
  id: string;
  name: string;
  boundary: [number, number][];
  terrain: string;
  climate: string;
}

export const RegionFormSchema = z
  .object({
    name: z.string().describe('Human-readable name for the region'),
    boundary: z
      .array(z.tuple([z.number(), z.number()]))
      .min(3, 'Boundary must have at least 3 points')
      .describe(
        'Polygon boundary as an array of coordinates, allows any shape',
      ),
    terrain: z.string().describe('Terrain type for the region'),
    climate: z.string().describe('Climate classification for the region'),
  })
  .describe(
    'A region on the map, with flexible geometry, terrain, water, and adjacency.',
  );

export type RegionForm = z.infer<typeof RegionFormSchema>;
