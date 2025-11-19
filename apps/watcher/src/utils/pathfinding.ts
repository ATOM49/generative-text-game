type CellId = string;

export interface GridCellLike {
  id: CellId;
  x: number;
  y: number;
  walkable: boolean;
}

export function buildAdjacency(cells: GridCellLike[]): Map<CellId, CellId[]> {
  const byCoord = new Map<string, GridCellLike>();
  for (const c of cells) {
    byCoord.set(`${c.x},${c.y}`, c);
  }

  const adj = new Map<CellId, CellId[]>();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (const c of cells) {
    const neighbors: CellId[] = [];
    if (!c.walkable) {
      adj.set(c.id, neighbors);
      continue;
    }

    for (const [dx, dy] of dirs) {
      const key = `${c.x + dx},${c.y + dy}`;
      const n = byCoord.get(key);
      if (n && n.walkable) {
        neighbors.push(n.id);
      }
    }
    adj.set(c.id, neighbors);
  }

  return adj;
}

export function bfsDistances(
  adj: Map<CellId, CellId[]>,
  start: CellId,
): Map<CellId, number> {
  const dist = new Map<CellId, number>();
  const q: CellId[] = [];
  dist.set(start, 0);
  q.push(start);

  while (q.length) {
    const cur = q.shift()!;
    const d = dist.get(cur)!;
    for (const nb of adj.get(cur) ?? []) {
      if (!dist.has(nb)) {
        dist.set(nb, d + 1);
        q.push(nb);
      }
    }
  }

  return dist;
}

export function bfsShortestPath(
  adj: Map<CellId, CellId[]>,
  start: CellId,
  goal: CellId,
): CellId[] | null {
  if (start === goal) return [start];

  const prev = new Map<CellId, CellId | null>();
  const q: CellId[] = [];
  prev.set(start, null);
  q.push(start);

  while (q.length) {
    const cur = q.shift()!;
    if (cur === goal) break;
    for (const nb of adj.get(cur) ?? []) {
      if (!prev.has(nb)) {
        prev.set(nb, cur);
        q.push(nb);
      }
    }
  }

  if (!prev.has(goal)) return null;

  const path: CellId[] = [];
  let cur: CellId | null = goal;
  while (cur !== null) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  path.reverse();
  return path;
}
