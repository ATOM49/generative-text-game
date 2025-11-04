import { FastifyPluginAsync } from 'fastify';
import mapRoute from './map';

const generateRoutes: FastifyPluginAsync = async (fastify) => {
  // Register map generation route
  fastify.register(mapRoute, { prefix: '/map' });

  // TODO: Add more generation routes here
  // fastify.register(regionRoute, { prefix: '/region' });
  // fastify.register(eventRoute, { prefix: '/event' });
  // fastify.register(locationRoute, { prefix: '/location' });
  // fastify.register(factionRoute, { prefix: '/faction' });
};

export default generateRoutes;
