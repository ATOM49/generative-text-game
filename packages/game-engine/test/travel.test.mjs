import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceTravel,
  buildTravelPlan,
  chooseTransport,
  fallbackTransportOptions,
  normalizeTraversal,
} from '../dist/index.js';

const cells = [
  {
    _id: 'land',
    gridId: 'grid',
    x: 0,
    y: 0,
    walkable: true,
    biome: 'grassland',
    tags: [],
  },
  {
    _id: 'water',
    gridId: 'grid',
    x: 1,
    y: 0,
    walkable: true,
    biome: 'open sea',
    tags: [],
  },
  {
    _id: 'cliff',
    gridId: 'grid',
    x: 2,
    y: 0,
    walkable: false,
    biome: 'cliff',
    tags: [],
  },
];

test('biome metadata takes precedence over permissive legacy walkable values', () => {
  assert.equal(normalizeTraversal(cells[1]).medium, 'WATER');
  assert.equal(normalizeTraversal(cells[1]).footAllowed, false);
});

test('routes include cells that legacy data marks unwalkable', () => {
  const plan = buildTravelPlan({
    cells,
    startCellId: 'land',
    destinationCellId: 'cliff',
  });
  assert.deepEqual(plan.pathCellIds, ['land', 'water', 'cliff']);
  assert.deepEqual(
    plan.legs.map((leg) => leg.medium),
    ['LAND', 'WATER', 'MOUNTAIN'],
  );
});

test('transport must support the active terrain before travel can continue', () => {
  let plan = buildTravelPlan({
    cells,
    startCellId: 'land',
    destinationCellId: 'water',
  });
  const firstAdvance = advanceTravel(plan);
  plan = firstAdvance.plan;
  assert.equal(firstAdvance.stop?.kind, 'TRANSPORT');
  assert.equal(firstAdvance.plan.currentIndex, 0);
  assert.deepEqual(firstAdvance.traversedCellIds, []);
  assert.throws(() =>
    chooseTransport(plan, fallbackTransportOptions('MOUNTAIN')[0]),
  );
  plan = chooseTransport(plan, fallbackTransportOptions('WATER')[0]);
  const arrival = advanceTravel(plan);
  assert.equal(arrival.plan.currentIndex, 1);
  assert.equal(arrival.stop?.kind, 'DESTINATION');
});

test('a route that begins on special terrain immediately requests transport', () => {
  const plan = buildTravelPlan({
    cells,
    startCellId: 'water',
    destinationCellId: 'cliff',
  });
  assert.equal(plan.stops[0]?.routeIndex, 0);
  assert.equal(plan.stops[0]?.kind, 'TRANSPORT');
  assert.throws(() => advanceTravel(plan), /Choose transport/);
});

test('required waypoints and encounters interrupt a distant route in order', () => {
  const routeCells = Array.from({ length: 5 }, (_, x) => ({
    _id: `cell-${x}`,
    gridId: 'grid',
    x,
    y: 0,
    walkable: true,
    biome: 'grassland',
    tags: [],
  }));
  let plan = buildTravelPlan({
    cells: routeCells,
    startCellId: 'cell-0',
    destinationCellId: 'cell-4',
    waypointCellIds: ['cell-2'],
    encounterCellIds: ['cell-3'],
  });

  const waypoint = advanceTravel(plan);
  assert.deepEqual(waypoint.traversedCellIds, ['cell-1', 'cell-2']);
  assert.equal(waypoint.actionCost, 2);
  assert.equal(waypoint.stop?.kind, 'WAYPOINT');
  plan = waypoint.plan;

  const encounter = advanceTravel(plan);
  assert.deepEqual(encounter.traversedCellIds, ['cell-3']);
  assert.equal(encounter.stop?.kind, 'ENCOUNTER');

  const arrival = advanceTravel(encounter.plan);
  assert.deepEqual(arrival.traversedCellIds, ['cell-4']);
  assert.equal(arrival.stop?.kind, 'DESTINATION');
});

test('rerouting creates a replacement plan from the authoritative current cell', () => {
  const routeCells = [
    ...cells,
    {
      _id: 'south',
      gridId: 'grid',
      x: 0,
      y: 1,
      walkable: true,
      biome: 'forest',
      tags: [],
    },
  ];
  const rerouted = buildTravelPlan({
    cells: routeCells,
    startCellId: 'land',
    destinationCellId: 'south',
  });
  assert.deepEqual(rerouted.pathCellIds, ['land', 'south']);
  assert.equal(rerouted.destinationCellId, 'south');
});

test('unusual impassable legacy cells receive a deterministic transport fallback', () => {
  const profile = normalizeTraversal({
    walkable: false,
    biome: 'glass wastes',
    name: 'The Singing Expanse',
    tags: [],
  });
  assert.equal(profile.medium, 'LAND');
  assert.equal(profile.footAllowed, false);
  const fallbacks = fallbackTransportOptions(profile.medium);
  assert.equal(fallbacks.length, 2);
  assert.equal(
    fallbacks.some((option) => option.id === 'on-foot'),
    false,
  );
});
